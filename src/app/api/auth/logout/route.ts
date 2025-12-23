import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth/session';
import { verifySessionForApi } from '@/lib/auth/dal';
import logger, { logAuth } from '@/lib/logger';

export async function POST() {
  try {
    const session = await verifySessionForApi();

    if (session.isAuth && session.userId) {
      logger.info('User logged out', {
        userId: session.userId,
      });

      logAuth('LOGOUT', session.userId);
    }

    await deleteSession();

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still delete the session even if there's an error
    await deleteSession();
    
    return NextResponse.json(
      { error: 'Logout completed with errors' },
      { status: 200 }
    );
  }
}
