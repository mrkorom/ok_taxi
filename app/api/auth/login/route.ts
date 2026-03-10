import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createTokenEdge } from '@/lib/auth-edge';
import type { AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        console.log('🔐 로그인 시도:', { phone });

        // 입력 검증
        if (!phone || !password) {
            console.log('❌ 입력 누락');
            return NextResponse.json<AuthResponse>(
                {
                    success: false,
                    message: '전화번호와 비밀번호를 입력해주세요.',
                },
                { status: 400 }
            );
        }

        // 전화번호로 사용자 조회
        console.log('📞 DB 조회 중:', phone);
        const [rows] = await pool.query(
            'SELECT id, name, phone, password, role FROM drivers WHERE phone = ?',
            [phone]
        );

        const users = rows as any[];
        console.log('👤 조회 결과:', users.length > 0 ? '사용자 발견' : '사용자 없음');

        if (users.length === 0) {
            console.log('❌ 사용자 없음');
            return NextResponse.json<AuthResponse>(
                {
                    success: false,
                    message: '전화번호 또는 비밀번호가 올바르지 않습니다.',
                },
                { status: 401 }
            );
        }

        const user = users[0];
        console.log('🔍 사용자 정보:', { id: user.id, name: user.name, role: user.role });

        // 비밀번호 검증
        console.log('🔑 비밀번호 검증 중...');
        const isPasswordValid = await verifyPassword(password, user.password);
        console.log('✔️ 비밀번호 검증 결과:', isPasswordValid ? '성공' : '실패');

        if (!isPasswordValid) {
            console.log('❌ 비밀번호 불일치');
            return NextResponse.json<AuthResponse>(
                {
                    success: false,
                    message: '전화번호 또는 비밀번호가 올바르지 않습니다.',
                },
                { status: 401 }
            );
        }

        // JWT 토큰 생성
        console.log('🎫 JWT 토큰 생성 중...');
        const token = await createTokenEdge({
            userId: user.id,
            phone: user.phone,
            role: user.role,
        });
        console.log('✅ 토큰 생성 완료');

        // 성공 응답
        console.log('🎉 로그인 성공!');
        return NextResponse.json<AuthResponse>({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
            message: '로그인 성공',
        });
    } catch (error) {
        console.error('💥 로그인 오류:', error);
        return NextResponse.json<AuthResponse>(
            {
                success: false,
                message: '서버 오류가 발생했습니다.',
            },
            { status: 500 }
        );
    }
}
