import { NextResponse } from 'next/server';
import { getUserForApi } from '@/lib/auth/dal';

export async function GET() {
  try {
    console.log('📡 Session endpoint called');
    const user = await getUserForApi();
    
    console.log('🔍 Session check result:', {
      userFound: !!user,
      userId: user?.id,
      role: user?.role,
    });

    if (!user) {
      console.log('❌ No user found in session');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('✅ Session valid for user:', user.email);
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          qrCode: user.qrCode ? `GYM|${user.qrCode}` : '',
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Session error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
