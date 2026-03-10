import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/auth-edge';

// Get assignments for a specific date
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    // Authentication is optional for GET, allowing public viewers to see the assignments.

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Join with drivers and vehicles to get full details
    const [rows] = await pool.query(
      `SELECT 
        a.id, a.assignment_date, a.driver_id, a.vehicle_id, a.shift, a.notes,
        d.name as driver_name, d.driver_code, d.phone, d.photo_url,
        v.vehicle_number, v.vehicle_type, v.car_model
       FROM assignments a
       JOIN drivers d ON a.driver_id = d.id
       JOIN vehicles v ON a.vehicle_id = v.id
       WHERE a.assignment_date = ?`,
      [date]
    );

    return NextResponse.json({ assignments: rows });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create or update assignment
export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    // Only admins or managers should be able to create/update assignments
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { assignment_date, vehicle_id, driver_id, shift = '전일', notes = '' } = data;

    if (!assignment_date || !vehicle_id || !driver_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if assignment already exists for this vehicle and date
      const [existingByVehicle] = await connection.query<any[]>(
        `SELECT id FROM assignments WHERE assignment_date = ? AND vehicle_id = ? AND shift = ?`,
        [assignment_date, vehicle_id, shift]
      );

      // Check if driver is already assigned to another vehicle on this date
      const [existingByDriver] = await connection.query<any[]>(
        `SELECT id, vehicle_id FROM assignments WHERE assignment_date = ? AND driver_id = ?`,
        [assignment_date, driver_id]
      );

      if (existingByDriver.length > 0 && existingByDriver[0].vehicle_id !== vehicle_id) {
        throw new Error('Driver is already assigned to another vehicle on this date');
      }

      let result;

      if (existingByVehicle.length > 0) {
        // Update existing
        [result] = await connection.query(
          `UPDATE assignments 
           SET driver_id = ?, notes = ?, updated_at = NOW() 
           WHERE id = ?`,
          [driver_id, notes, existingByVehicle[0].id]
        );
      } else {
        // Insert new
        [result] = await connection.query(
          `INSERT INTO assignments (assignment_date, vehicle_id, driver_id, shift, notes) 
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE vehicle_id = VALUES(vehicle_id), shift = VALUES(shift), notes = VALUES(notes)`,
          [assignment_date, vehicle_id, driver_id, shift, notes]
        );
      }

      await connection.commit();

      // Fetch the updated/inserted record to return
      const [updatedRecord] = await connection.query<any[]>(
        `SELECT 
          a.id, a.assignment_date, a.driver_id, a.vehicle_id, a.shift, a.notes,
          d.name as driver_name, d.driver_code, d.phone, d.photo_url,
          v.vehicle_number, v.vehicle_type, v.car_model
         FROM assignments a
         JOIN drivers d ON a.driver_id = d.id
         JOIN vehicles v ON a.vehicle_id = v.id
         WHERE a.assignment_date = ? AND a.vehicle_id = ? AND a.driver_id = ?`,
        [assignment_date, vehicle_id, driver_id]
      );

      return NextResponse.json({ 
        success: true, 
        message: existingByVehicle.length > 0 ? 'Assignment updated' : 'Assignment created',
        assignment: updatedRecord[0] 
      });

    } catch (error: any) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error saving assignment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Delete assignment
export async function DELETE(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const [result] = await pool.query<any>(
      `DELETE FROM assignments WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
