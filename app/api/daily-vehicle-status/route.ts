import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/auth-edge';

// GET: Fetch daily vehicle statuses for a specific date
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const [rows] = await pool.query(
      `SELECT d.id, d.status_date, d.vehicle_id, d.status 
       FROM daily_vehicle_statuses d
       WHERE d.status_date = ?`,
      [date]
    );

    return NextResponse.json({ statuses: rows });
  } catch (error) {
    console.error('Error fetching daily vehicle statuses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create or update daily vehicle status
export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { date, vehicle_id, status } = data;

    if (!date || !vehicle_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check valid status
    const validStatuses = ['정상', '점검', '부제', '대기'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO daily_vehicle_statuses (status_date, vehicle_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [date, vehicle_id, status]
    );

    return NextResponse.json({ success: true, message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('Error saving daily vehicle status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
