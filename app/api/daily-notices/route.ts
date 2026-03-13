import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/auth-edge';

// GET: 날짜별 공지사항 조회 (인증 불필요 - 공개)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const [rows] = await pool.query<any[]>(
      `SELECT id, notice_date, content, is_active, updated_at
       FROM daily_notices
       WHERE notice_date = ? AND is_active = TRUE`,
      [date]
    );

    const notice = (rows as any[]).length > 0 ? (rows as any[])[0] : null;

    return NextResponse.json({ notice });
  } catch (error) {
    console.error('Error fetching daily notice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: 공지사항 생성 또는 수정 (관리자/매니저 전용)
export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);

    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { notice_date, content, is_active = true } = data;

    if (!notice_date) {
      return NextResponse.json({ error: 'notice_date is required' }, { status: 400 });
    }

    // UPSERT: 날짜가 이미 있으면 업데이트, 없으면 삽입
    await pool.query(
      `INSERT INTO daily_notices (notice_date, content, is_active, created_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         content = VALUES(content),
         is_active = VALUES(is_active),
         updated_at = NOW()`,
      [notice_date, content || '', is_active, authResult.user?.userId ?? null]
    );

    // 저장된 레코드 반환
    const [rows] = await pool.query<any[]>(
      `SELECT id, notice_date, content, is_active, updated_at
       FROM daily_notices WHERE notice_date = ?`,
      [notice_date]
    );

    return NextResponse.json({ success: true, notice: (rows as any[])[0] });
  } catch (error: any) {
    console.error('Error saving daily notice:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
