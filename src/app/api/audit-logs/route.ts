import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view audit logs
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (action && action !== 'all') {
      where.action = action;
    }

    if (entityType && entityType !== 'all') {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate) {
      where.timestamp = {
        ...where.timestamp,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // Set to end of day
      where.timestamp = {
        ...where.timestamp,
        lte: endDateTime,
      };
    }

    try {
      // Try to fetch from audit logs table (will work after migration)
      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: offset,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      // Transform data for frontend
      interface TransformedAuditLog {
        id: string;
        action: string;
        entityType: string;
        entityId: string | null;
        userId: string;
        userName: string;
        userEmail: string;
        changes: any;
        ipAddress: string | null;
        userAgent: string | null;
        sessionId: string | null;
        metadata: any;
        timestamp: string;
        user: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string;
          role: string;
        } | null;
      }

      const transformedLogs: TransformedAuditLog[] = auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        userName: log.userName,
        userEmail: log.userEmail,
        changes: log.changes,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: log.sessionId,
        metadata: log.metadata,
        timestamp: log.timestamp.toISOString(),
        user: log.user,
      }));

      // Get summary statistics
      const statsWhere = { ...where };
      delete statsWhere.timestamp; // Remove date filter for overall stats
      
      const [recentStats, overallStats] = await Promise.all([
        // Recent activity (last 24 hours)
        prisma.auditLog.groupBy({
          by: ['action'],
          where: {
            ...statsWhere,
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          _count: { action: true },
        }),
        // Overall stats
        prisma.auditLog.groupBy({
          by: ['action'],
          where: statsWhere,
          _count: { action: true },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: transformedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        statistics: {
          recent: recentStats.map(stat => ({
            action: stat.action,
            count: stat._count.action,
          })),
          overall: overallStats.map(stat => ({
            action: stat.action,
            count: stat._count.action,
          })),
        },
        filters: {
          action: action || 'all',
          entityType: entityType || 'all',
          userId: userId || null,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });

    } catch (dbError: any) {
      // If audit log table doesn't exist yet (before migration), return mock data
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.warn('AuditLog table does not exist, returning mock data. Please run database migration.');
        
        // Mock audit logs data (for backward compatibility)
        let mockAuditLogs = [
          {
            id: '1',
            action: 'login',
            entityType: 'Session',
            entityId: null,
            userId: session.userId,
            userName: 'System User',
            userEmail: 'admin@example.com',
            changes: null,
            ipAddress: '127.0.0.1',
            userAgent: null,
            sessionId: null,
            metadata: null,
            timestamp: new Date().toISOString(),
            user: { id: session.userId, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'ADMIN' }
          },
          {
            id: '2',
            action: 'member_created',
            entityType: 'User',
            entityId: 'user_123',
            userId: session.userId,
            userName: 'System User',
            userEmail: 'admin@example.com',
            changes: { email: 'john@example.com', status: 'active' },
            ipAddress: '127.0.0.1',
            userAgent: null,
            sessionId: null,
            metadata: null,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            user: { id: session.userId, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'ADMIN' }
          },
          {
            id: '3',
            action: 'subscription_created',
            entityType: 'Subscription',
            entityId: 'sub_456',
            userId: session.userId,
            userName: 'System User',
            userEmail: 'admin@example.com',
            changes: { plan: 'premium', duration: '6_months' },
            ipAddress: '127.0.0.1',
            userAgent: null,
            sessionId: null,
            metadata: null,
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            user: { id: session.userId, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'ADMIN' }
          }
        ];

        // Apply filtering to mock data
        if (action && action !== 'all') {
          mockAuditLogs = mockAuditLogs.filter(log => log.action === action);
        }

        if (startDate) {
          const start = new Date(startDate);
          mockAuditLogs = mockAuditLogs.filter(log => new Date(log.timestamp) >= start);
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          mockAuditLogs = mockAuditLogs.filter(log => new Date(log.timestamp) <= end);
        }

        // Apply pagination to mock data
        const paginatedMockLogs = mockAuditLogs.slice(offset, offset + limit);
        const mockTotal = mockAuditLogs.length;

        return NextResponse.json({
          success: true,
          data: paginatedMockLogs,
          pagination: {
            page,
            limit,
            total: mockTotal,
            totalPages: Math.ceil(mockTotal / limit),
            hasNext: page * limit < mockTotal,
            hasPrev: page > 1,
          },
          statistics: {
            recent: [{ action: 'login', count: 1 }, { action: 'member_created', count: 1 }],
            overall: [{ action: 'login', count: 1 }, { action: 'member_created', count: 1 }, { action: 'subscription_created', count: 1 }],
          },
          filters: {
            action: action || 'all',
            entityType: entityType || 'all',
            userId: userId || null,
            startDate: startDate || null,
            endDate: endDate || null,
          },
          _warning: 'Using mock data. Please run database migration to enable full audit logging.',
        });
      } else {
        throw dbError; // Re-throw other database errors
      }
    }

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}