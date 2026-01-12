import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// GET /api/classes/[id]/reviews - Get class reviews
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;

    const reviews = await prisma.classReview.findMany({
      where: {
        classId,
        status: 'published',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reviews: reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isAnonymous: review.isAnonymous,
        createdAt: review.createdAt,
        user: review.isAnonymous
          ? null
          : {
              id: review.user.id,
              name: `${review.user.firstName} ${review.user.lastName}`,
              profileImage: review.user.profileImage,
            },
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/reviews - Submit review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: classId } = await params;
    const body = await request.json();
    const { rating, comment, isAnonymous } = body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user has attended this class
    const hasAttended = await prisma.classBooking.findFirst({
      where: {
        userId: session.userId!,
        classId,
        status: 'attended',
      },
    });

    if (!hasAttended) {
      return NextResponse.json(
        { success: false, error: 'You must attend the class before reviewing' },
        { status: 400 }
      );
    }

    // Check if already reviewed
    const existingReview = await prisma.classReview.findUnique({
      where: {
        userId_classId: {
          userId: session.userId!,
          classId,
        },
      },
    });

    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.classReview.update({
        where: { id: existingReview.id },
        data: {
          rating: parseInt(rating),
          comment: comment || null,
          isAnonymous: isAnonymous || false,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Review updated successfully',
        review: updatedReview,
      });
    }

    // Create new review
    const review = await prisma.classReview.create({
      data: {
        userId: session.userId!,
        classId,
        rating: parseInt(rating),
        comment: comment || null,
        isAnonymous: isAnonymous || false,
        status: 'published',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
