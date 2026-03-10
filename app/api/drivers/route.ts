import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAuth } from '@/lib/auth-edge';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import path from 'path';

// GET: 기사 목록 조회 (배차용 및 관리자용 모두 지원)
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    // Authentication is optional for GET, allowing public viewers to see contacts

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'active';
    const status = searchParams.get('status');
    const workType = searchParams.get('work_type');
    const search = searchParams.get('search');

    let query = `
       SELECT id, driver_code, name, phone, status, role, start_date, created_at, photo_url, work_type 
       FROM drivers
    `;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (mode === 'active') {
      whereClauses.push("role = 'driver'");
      whereClauses.push("status = '운행'");
    } else {
      // Exclude admins/managers from the general driver list
      whereClauses.push("role = 'driver'");
      
      if (status && status !== '전체') {
        whereClauses.push("status = ?");
        queryParams.push(status);
      }
      if (workType && workType !== '전체') {
        whereClauses.push("work_type = ?");
        queryParams.push(workType);
      }
      if (search) {
        whereClauses.push("(name LIKE ? OR driver_code LIKE ? OR phone LIKE ?)");
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')} `;
    }

    query += ` ORDER BY created_at DESC, name ASC`;

    const [rows] = await pool.query(query, queryParams);

    const [totalCountResult] = await pool.query<any[]>('SELECT COUNT(*) as count FROM drivers WHERE role = ?', ['driver']);
    const totalCount = totalCountResult[0].count;

    return NextResponse.json({ drivers: rows, totalCount });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function saveFile(file: File): Promise<string | null> {
  if (!file) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const filepath = path.join(process.cwd(), 'public/uploads/drivers', filename);
  
  await writeFile(filepath, buffer);
  return `/uploads/drivers/${filename}`;
}

// POST: 신규 기사 등록
export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    
    const driver_code = formData.get('driver_code') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const status = (formData.get('status') as string) || '운행';
    const work_type = formData.get('work_type') as string;
    const start_date = formData.get('start_date') as string;
    const role = (formData.get('role') as string) || 'driver';
    const password = '1234'; 
    const file = formData.get('photo') as File | null;

    if (!driver_code || !name || !phone || !work_type || !start_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save photo if exists
    let photoUrl = null;
    if (file && file.size > 0) {
      photoUrl = await saveFile(file);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [existing] = await connection.query<any[]>(
        `SELECT id FROM drivers WHERE driver_code = ? OR phone = ?`,
        [driver_code, phone]
      );

      if (existing.length > 0) {
        throw new Error('사번 또는 전화번호가 이미 존재합니다.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [driverResult] = await connection.query<any>(
        `INSERT INTO drivers (driver_code, name, phone, password, status, role, start_date, photo_url, work_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [driver_code, name, phone, hashedPassword, status, role, start_date, photoUrl, work_type]
      );

      const driverId = driverResult.insertId;

      await connection.commit();

      return NextResponse.json({ 
        success: true, 
        message: 'Driver created successfully',
        driverId,
        photoUrl
      });
    } catch (error: any) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: 기사 정보 수정
export async function PUT(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated || (authResult.role !== 'admin' && authResult.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const status = formData.get('status') as string;
    const role = formData.get('role') as string;
    const work_type = formData.get('work_type') as string;
    const start_date = formData.get('start_date') as string;
    const file = formData.get('photo') as File | null;

    if (!id) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // Save new photo if exists
    let photoUrl = null;
    if (file && file.size > 0) {
      photoUrl = await saveFile(file);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [currentDriver] = await connection.query<any[]>(
        `SELECT phone, work_type 
         FROM drivers
         WHERE id = ?`,
        [id]
      );

      if (currentDriver.length === 0) {
        throw new Error('기사를 찾을 수 없습니다.');
      }

      if (phone && phone !== currentDriver[0].phone) {
        const [existing] = await connection.query<any[]>(
          `SELECT id FROM drivers WHERE phone = ? AND id != ?`,
          [phone, id]
        );
        if (existing.length > 0) {
          throw new Error('전화번호가 이미 존재합니다.');
        }
      }

      const updateFields = [];
      const updateValues = [];

      if (name) { updateFields.push('name = ?'); updateValues.push(name); }
      if (phone) { updateFields.push('phone = ?'); updateValues.push(phone); }
      if (status) { updateFields.push('status = ?'); updateValues.push(status); }
      if (role) { updateFields.push('role = ?'); updateValues.push(role); }
      if (start_date) { updateFields.push('start_date = ?'); updateValues.push(start_date); }
      if (photoUrl) { updateFields.push('photo_url = ?'); updateValues.push(photoUrl); }
      if (work_type) { updateFields.push('work_type = ?'); updateValues.push(work_type); }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await connection.query(
          `UPDATE drivers SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Driver updated successfully', photoUrl });

    } catch (error: any) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: 기사 정보 삭제
export async function DELETE(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated || authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });

    const [result] = await pool.query<any>(
      `UPDATE drivers SET status = '퇴사' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
