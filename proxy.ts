import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth-edge';

// 보호할 경로 목록
const protectedPaths = ['/dashboard', '/drivers', '/vehicles', '/assignments', '/statistics'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 보호된 경로인지 확인
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    if (isProtectedPath) {
        console.log('🔒 보호된 경로 접근:', pathname);

        // Authorization 헤더에서 토큰 가져오기
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        // 쿠키에서 토큰 가져오기 (fallback)
        const tokenFromCookie = request.cookies.get('token')?.value;

        const authToken = token || tokenFromCookie;

        console.log('🎫 토큰 확인:', {
            헤더토큰: token ? '있음' : '없음',
            쿠키토큰: tokenFromCookie ? '있음' : '없음',
            최종토큰: authToken ? '있음' : '없음'
        });

        // 토큰이 없으면 로그인 페이지로 리다이렉트
        if (!authToken) {
            console.log('❌ 토큰 없음, 로그인 페이지로 리다이렉트');
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // 토큰 검증
        console.log('🔍 토큰 검증 중...');
        const payload = await verifyTokenEdge(authToken);
        console.log('✔️ 토큰 검증 결과:', payload ? '유효' : '무효');

        if (!payload) {
            // 유효하지 않은 토큰이면 로그인 페이지로 리다이렉트
            console.log('❌ 유효하지 않은 토큰, 로그인 페이지로 리다이렉트');
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // 토큰이 유효하면 요청 계속 진행
        console.log('✅ 인증 성공, 요청 진행');
        return NextResponse.next();
    }

    // 보호되지 않은 경로는 그대로 진행
    return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
    matcher: [
        /*
         * 다음 경로를 제외한 모든 경로에서 실행:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
