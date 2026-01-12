import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string | undefined;
  userId: string;
  userName: string;
  userEmail: string;
  changes?: Record<string, any> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  sessionId?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export class AuditLogger {
  /**
   * Create an audit log entry
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId ?? null,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          sessionId: data.sessionId ?? null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        },
      });
      
      logger.info('Audit log created', {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, data });
      // Don't throw error to prevent audit logging from breaking main functionality
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(
    action: 'login' | 'logout' | 'login_failed',
    userId: string,
    userName: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'User',
      entityId: userId,
      userId,
      userName,
      userEmail,
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
      ...(metadata && { metadata }),
    });
  }

  /**
   * Log member management events
   */
  static async logMemberAction(
    action: 'member_created' | 'member_updated' | 'member_deleted' | 'member_suspended' | 'member_activated',
    memberId: string,
    performedByUserId: string,
    performedByName: string,
    performedByEmail: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'User',
      entityId: memberId,
      userId: performedByUserId,
      userName: performedByName,
      userEmail: performedByEmail,
      changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log subscription events
   */
  static async logSubscriptionAction(
    action: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'subscription_renewed',
    subscriptionId: string,
    userId: string,
    userName: string,
    userEmail: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'Subscription',
      entityId: subscriptionId,
      userId,
      userName,
      userEmail,
      changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log payment events
   */
  static async logPaymentAction(
    action: 'payment_created' | 'payment_success' | 'payment_failed' | 'payment_refunded',
    paymentId: string,
    userId: string,
    userName: string,
    userEmail: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'Payment',
      entityId: paymentId,
      userId,
      userName,
      userEmail,
      changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log check-in events
   */
  static async logCheckInAction(
    action: 'checkin_created' | 'checkout_created' | 'checkin_manual',
    checkInId: string,
    userId: string,
    userName: string,
    userEmail: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'CheckIn',
      entityId: checkInId,
      userId,
      userName,
      userEmail,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log class management events
   */
  static async logClassAction(
    action: 'class_created' | 'class_updated' | 'class_deleted' | 'class_cancelled' | 'class_enrolled' | 'class_unenrolled',
    classId: string,
    userId: string,
    userName: string,
    userEmail: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'Class',
      entityId: classId,
      userId,
      userName,
      userEmail,
      changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log event management events
   */
  static async logEventAction(
    action: 'event_created' | 'event_updated' | 'event_deleted' | 'event_cancelled' | 'event_registered' | 'event_unregistered',
    eventId: string,
    userId: string,
    userName: string,
    userEmail: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'Event',
      entityId: eventId,
      userId,
      userName,
      userEmail,
      changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log system settings changes
   */
  static async logSettingsAction(
    action: 'settings_updated',
    settingType: string,
    userId: string,
    userName: string,
    userEmail: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'Settings',
      entityId: settingType,
      userId,
      userName,
      userEmail,
      changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log staff management events
   */
  static async logStaffAction(
    action: 'staff_created' | 'staff_updated' | 'staff_deleted' | 'role_changed',
    staffId: string,
    performedByUserId: string,
    performedByName: string,
    performedByEmail: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      entityType: 'User',
      entityId: staffId,
      userId: performedByUserId,
      userName: performedByName,
      userEmail: performedByEmail,
      ...(changes && { changes }),
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
    });
  }
}

/**
 * Utility function to get client IP and user agent from request headers
 */
export function getClientInfo(request: Request): { ipAddress?: string | undefined; userAgent?: string | undefined } {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1';
    
  const userAgent = request.headers.get('user-agent') || undefined;
  
  return { ipAddress: ipAddress || undefined, userAgent };
}

/**
 * Utility function to generate session ID for tracking
 */
export function generateSessionId(): string {
  return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}