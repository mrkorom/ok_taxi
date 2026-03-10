import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// 테스트용 API: 비밀번호 해시 생성
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: '비밀번호를 입력하세요' },
                { status: 400 }
            );
        }

        const hash = await hashPassword(password);

        return NextResponse.json({
            password,
            hash,
            message: '비밀번호 해시가 생성되었습니다.',
        });
    } catch (error) {
        console.error('오류:', error);
        return NextResponse.json(
            { error: '서버 오류' },
            { status: 500 }
        );
    }
}

// 테스트용 API: Admin 계정 비밀번호 확인
export async function GET() {
    try {
        const [rows] = await pool.query(
            'SELECT id, phone, password FROM drivers WHERE phone = ?',
            ['01000000000']
        );

        const users = rows as any[];

        if (users.length === 0) {
            return NextResponse.json({
                found: false,
                message: 'Admin 계정이 없습니다.',
            });
        }

        const user = users[0];

        return NextResponse.json({
            found: true,
            id: user.id,
            phone: user.phone,
            passwordHash: user.password.substring(0, 30) + '...',
            message: 'Admin 계정이 존재합니다.',
        });
    } catch (error) {
        console.error('오류:', error);
        return NextResponse.json(
            { error: '서버 오류' },
            { status: 500 }
        );
    }
}
