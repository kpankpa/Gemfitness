/**
 * Simple test script to verify audit logging functionality
 */

const { PrismaClient } = require('@prisma/client');

async function testAuditLogging() {
  const prisma = new PrismaClient();

  try {
    console.log('🧪 Testing audit log system...');

    // Check if AuditLog table exists and is accessible
    const auditLogCount = await prisma.auditLog.count();
    console.log('✅ AuditLog table is accessible');
    console.log(`📊 Current audit logs count: ${auditLogCount}`);

    // Test creating a sample audit log
    const testLog = await prisma.auditLog.create({
      data: {
        action: 'system_test',
        entityType: 'Test',
        entityId: 'test_123',
        userId: 'test_user',
        userName: 'Test User',
        userEmail: 'test@example.com',
        changes: {
          testField: 'testValue'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Script',
        metadata: {
          source: 'test_script'
        }
      }
    });

    console.log('✅ Successfully created test audit log:', testLog.id);

    // Test querying audit logs
    const recentLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        userName: true,
        timestamp: true
      }
    });

    console.log('✅ Recent audit logs:');
    recentLogs.forEach(log => {
      console.log(`   - ${log.timestamp.toISOString()}: ${log.action} by ${log.userName}`);
    });

    // Clean up test log
    await prisma.auditLog.delete({ where: { id: testLog.id } });
    console.log('✅ Test log cleaned up');

    console.log('🎉 Audit logging system is working correctly!');

  } catch (error) {
    console.error('❌ Audit logging test failed:', error.message);
    
    if (error.code === 'P2021') {
      console.log('💡 Run: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuditLogging();