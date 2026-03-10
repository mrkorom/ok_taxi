import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/auth-edge';

export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      // 1. Get total drivers
      const [driversResult] = await connection.query<any[]>(
        `SELECT COUNT(*) as count FROM drivers WHERE status != '퇴사'`
      );
      const totalDrivers = driversResult[0].count;

      // 2. Get total vehicles
      const [vehiclesResult] = await connection.query<any[]>(
        `SELECT COUNT(*) as count FROM vehicles WHERE status != '폐차'`
      );
      const totalVehicles = vehiclesResult[0].count;

      // 3. Get latest assignment date
      const [assignmentsResult] = await connection.query<any[]>(
        `SELECT MAX(assignment_date) as last_date FROM assignments`
      );
      const lastAssignmentDate = assignmentsResult[0].last_date; // Could be null if no assignments exist

      return NextResponse.json({ 
        totalDrivers, 
        totalVehicles, 
        lastAssignmentDate 
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
