import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-edge';

export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      user: authResult.user 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
