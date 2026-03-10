import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'taxi-management-system-secret-key-2026';
const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
    userId: number;
    phone: string;
    role: 'admin' | 'manager' | 'driver';
}

/**
 * JWT 토큰 생성 (jose 사용 - Edge Runtime 호환)
 */
export async function createTokenEdge(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

/**
 * JWT 토큰 검증 (jose 사용 - Edge Runtime 호환)
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
    try {
        console.log('🔐 JWT 검증 시작 (Edge Runtime - jose)');
        console.log('  - 토큰 길이:', token.length);
        console.log('  - 토큰 앞 20자:', token.substring(0, 20));

        const { payload } = await jwtVerify(token, secret);
        console.log('  - jose 검증 성공:', payload);

        // jose의 JWTPayload를 우리의 커스텀 JWTPayload 타입으로 변환
        const result: JWTPayload = {
            userId: payload.userId as number,
            phone: payload.phone as string,
            role: payload.role as 'admin' | 'manager' | 'driver'
        };
        console.log('  - 최종 결과:', result);
        return result;
    } catch (error) {
        console.error('  - jose 검증 실패:', error instanceof Error ? error.message : error);
        return null;
    }
}

/**
 * HTTP Request에서 토큰을 추출하고 검증하여 사용자 인증 상태를 반환합니다.
 */
export async function verifyAuth(request: Request) {
    try {
        let token = '';
        
        // 1. Authorization 헤더 확인
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            // 2. 쿠키 확인
            const cookieHeader = request.headers.get('Cookie');
            if (cookieHeader) {
                const cookies = cookieHeader.split(';').map(c => c.trim());
                const tokenCookie = cookies.find(c => c.startsWith('token='));
                if (tokenCookie) {
                    token = tokenCookie.substring(6);
                }
            }
        }

        if (!token) {
            return { isAuthenticated: false, user: null, role: null };
        }

        const payload = await verifyTokenEdge(token);
        if (!payload) {
            return { isAuthenticated: false, user: null, role: null };
        }

        return { 
            isAuthenticated: true, 
            user: payload,
            role: payload.role 
        };
    } catch (error) {
        console.error('인증 검증 중 오류 발생:', error);
        return { isAuthenticated: false, user: null, role: null };
    }
}
