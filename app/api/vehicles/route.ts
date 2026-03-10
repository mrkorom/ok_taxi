import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/auth-edge';

// GET: 차량 목록 조회
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    // Authentication is optional for GET, allowing public viewers to see the assignment grid that relies on the vehicle list.

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all'; // 'active' for dispatch, 'all' for admin list
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
       SELECT id, vehicle_number, vehicle_type, fuel_type, registration_date, status, created_at, car_model, model_year 
       FROM vehicles
    `;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (mode === 'active') {
      whereClauses.push("status = '운행가능'");
    } else {
      // Admin filter
      if (status && status !== '전체') {
        whereClauses.push("status = ?");
        queryParams.push(status);
      }
      if (search) {
        whereClauses.push("(vehicle_number LIKE ? OR vehicle_type LIKE ?)");
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern);
      }
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')} `;
    }

    query += ` ORDER BY vehicle_number ASC`;

    const [rows] = await pool.query(query, queryParams);

    return NextResponse.json({ vehicles: rows });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: 신규 차량 등록
export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    // Only admins or managers should be able to create vehicles
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { vehicle_number, vehicle_type, fuel_type = 'LPG', registration_date, status = '운행가능', car_model, model_year } = data;

    if (!vehicle_number || !vehicle_type || !registration_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // 중복 번호 체크
      const [existing] = await connection.query<any[]>(
        `SELECT id FROM vehicles WHERE vehicle_number = ?`,
        [vehicle_number]
      );

      if (existing.length > 0) {
        throw new Error('이미 등록된 차량 번호입니다.');
      }

      const [result] = await connection.query<any>(
        `INSERT INTO vehicles (vehicle_number, vehicle_type, fuel_type, registration_date, status, car_model, model_year) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vehicle_number, vehicle_type, fuel_type, registration_date, status, car_model || '', model_year || '']
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Vehicle created successfully',
        vehicleId: result.insertId 
      });

    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: 기존 차량 수정
export async function PUT(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { id, vehicle_number, vehicle_type, fuel_type, registration_date, status, car_model, model_year } = data;

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Check duplicate number if number is changing
      if (vehicle_number) {
        const [existing] = await connection.query<any[]>(
          `SELECT id FROM vehicles WHERE vehicle_number = ? AND id != ?`,
          [vehicle_number, id]
        );
        if (existing.length > 0) {
          throw new Error('이미 존재하는 차량 번호입니다.');
        }
      }

      const updateFields = [];
      const updateValues = [];

      if (vehicle_number) { updateFields.push('vehicle_number = ?'); updateValues.push(vehicle_number); }
      if (vehicle_type) { updateFields.push('vehicle_type = ?'); updateValues.push(vehicle_type); }
      if (fuel_type) { updateFields.push('fuel_type = ?'); updateValues.push(fuel_type); }
      if (registration_date) { updateFields.push('registration_date = ?'); updateValues.push(registration_date); }
      if (status) { updateFields.push('status = ?'); updateValues.push(status); }
      if (car_model !== undefined) { updateFields.push('car_model = ?'); updateValues.push(car_model); }
      if (model_year !== undefined) { updateFields.push('model_year = ?'); updateValues.push(model_year); }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await connection.query(
          `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // If status changed to '폐차' or '정비중', we might want to handle existing future assignments
      // Here we just update the vehicle itself. 
      // Future Enhancement: Delete future assignments if vehicle is '폐차'

      return NextResponse.json({ success: true, message: 'Vehicle updated successfully' });

    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: 차량 삭제 (폐차 처리 권장되나 완전 삭제 기능 제공)
export async function DELETE(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated || authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    // 논리적 삭제(폐차 상태 변경) 대신 물리적 삭제. 단 외래키 트리거로 assignments도 날아감.
    // 안전을 피하고 싶으면 이 API 대신 PUT으로 상태업데이트 유도.
    // 여기서는 물리적 삭제 지원하되, assignments가 CASCADE 삭제됨.
    const [result] = await pool.query<any>(
      `DELETE FROM vehicles WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
