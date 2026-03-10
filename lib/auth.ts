import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'taxi-management-system-secret-key-2026';

export interface JWTPayload {
    userId: number;
    phone: string;
    role: 'admin' | 'manager' | 'driver';
}

/**
 * JWT 토큰 생성
 */
export function createToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d', // 7일 유효
    });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        console.log('🔐 JWT 검증 시작');
        console.log('  - 토큰 길이:', token.length);
        console.log('  - 토큰 앞 20자:', token.substring(0, 20));
        console.log('  - JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');

        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        console.log('  - 검증 성공:', decoded);
        return decoded;
    } catch (error) {
        console.error('  - 검증 실패:', error instanceof Error ? error.message : error);
        return null;
    }
}

/**
 * 비밀번호 해시 생성
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
