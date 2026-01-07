import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { processMemberImage } from '@/lib/image/processor';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const userId = formData.get('userId') as string;

    // Allow staff to upload for any member, or members to upload for themselves
    const isStaff = session.role === 'RECEPTIONIST' || session.role === 'MANAGER' || session.role === 'ADMIN';
    const targetUserId = (userId || session.userId) as string;

    if (!isStaff && targetUserId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image using existing processor
    const { imagePath } = await processMemberImage(buffer, file.name, targetUserId);

    // Update user profile
    await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        profileImage: imagePath || null,
        updatedAt: new Date()
      },
    });

    return NextResponse.json({
      success: true,
      profileImage: imagePath || '',
      message: 'Profile picture uploaded successfully',
    });
  } catch (error: unknown) {
    console.error('Error uploading profile image:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'FILE_TOO_LARGE') {
        return NextResponse.json({ error: 'Image file is too large. Maximum size is 2MB.' }, { status: 400 });
      }
      if (error.code === 'INVALID_IMAGE') {
        return NextResponse.json({ error: 'Invalid image file. Please upload a valid image.' }, { status: 400 });
      }
      if (error.code === 'UNSUPPORTED_FORMAT') {
        return NextResponse.json({ error: 'Unsupported image format. Please use JPEG, PNG, or WebP.' }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Allow staff to delete for any member, or members to delete for themselves
    const isStaff = session.role === 'RECEPTIONIST' || session.role === 'MANAGER' || session.role === 'ADMIN';
    const targetUserId = (userId || session.userId) as string;

    if (!isStaff && targetUserId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove profile image
    await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        profileImage: null,
        updatedAt: new Date()
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully',
    });
  } catch (error) {
    console.error('Error removing profile image:', error);
    return NextResponse.json(
      { error: 'Failed to remove profile picture' },
      { status: 500 }
    );
  }
}
