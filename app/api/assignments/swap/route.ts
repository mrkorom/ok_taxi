import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/auth-edge';

export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    // Only admins or managers should be able to swap assignments
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { date, source_vehicle_id, target_vehicle_id } = data;

    if (!date || !source_vehicle_id || !target_vehicle_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get existing assignments for BOTH vehicles on the given date
      const [assignments] = await connection.query<any[]>(
        `SELECT id, vehicle_id, driver_id, shift, notes FROM assignments WHERE assignment_date = ? AND vehicle_id IN (?, ?)`,
        [date, source_vehicle_id, target_vehicle_id]
      );

      const sourceAssignment = assignments.find(a => a.vehicle_id === source_vehicle_id);
      const targetAssignment = assignments.find(a => a.vehicle_id === target_vehicle_id);

      // If neither has an assignment, there's nothing to swap
      if (!sourceAssignment && !targetAssignment) {
        throw new Error('배차 정보가 없어 교환할 수 없습니다.');
      }

      // If source has an assignment, move it to target
      if (sourceAssignment) {
        await connection.query(
          `UPDATE assignments SET vehicle_id = ? WHERE id = ?`,
          [target_vehicle_id, sourceAssignment.id]
        );
      }

      // If target had an assignment, move it to source
      if (targetAssignment) {
        await connection.query(
          `UPDATE assignments SET vehicle_id = ? WHERE id = ?`,
          [source_vehicle_id, targetAssignment.id]
        );
      }

      await connection.commit();

      return NextResponse.json({ 
        success: true, 
        message: '배차 교환 성공',
      });

    } catch (error: any) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error swapping assignments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
