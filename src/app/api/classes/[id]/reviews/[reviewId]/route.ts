import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// DELETE /api/classes/[id]/reviews/[reviewId] - Delete review
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    // Get review
    const review = await prisma.classReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user owns the review or is admin
    if (
      review.userId !== session.userId &&
      session.role !== 'ADMIN' &&
      session.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this review' },
        { status: 403 }
      );
    }

    await prisma.classReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
