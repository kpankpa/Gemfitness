import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';

interface Transaction {
  date: Date | string;
  member: string;
  email: string;
  plan: string;
  amount: number;
  method: string;
  reference?: string;
}

interface DailyTrend {
  date: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  newMembers: number;
  totalMembers: number;
}

interface TopMember {
  name: string;
  email: string;
  count: number;
}

interface ExportReportData {
  type: string;
  transactions?: Transaction[];
  trends?: {
    daily?: DailyTrend[];
    monthly?: MonthlyTrend[];
  };
  breakdown?: {
    topMembers?: TopMember[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'MANAGER' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { format, reportData } = body;

    if (format === 'csv') {
      return exportToCSV(reportData);
    } else if (format === 'excel') {
      // For Excel, we'll use CSV format that Excel can open
      return exportToCSV(reportData);
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function exportToCSV(reportData: ExportReportData) {
  let csv = '';
  
  if (reportData.type === 'revenue' && reportData.transactions) {
    // Revenue report CSV
    csv = 'Date,Member,Email,Plan,Amount,Method,Reference\n';
    reportData.transactions.forEach((t) => {
      csv += `${new Date(t.date).toLocaleDateString()},${t.member},"${t.email}",${t.plan},${t.amount},${t.method},${t.reference || 'N/A'}\n`;
    });
  } else if (reportData.type === 'attendance') {
    // Attendance report CSV
    csv = 'Date,Total Check-ins\n';
    reportData.trends?.daily?.forEach((d) => {
      csv += `${d.date},${d.count}\n`;
    });
    
    csv += '\n\nTop Members\n';
    csv += 'Name,Email,Check-ins\n';
    reportData.breakdown?.topMembers?.forEach((m) => {
      csv += `${m.name},"${m.email}",${m.count}\n`;
    });
  } else if (reportData.type === 'growth') {
    // Growth report CSV
    csv = 'Month,New Members,Total Members\n';
    reportData.trends?.monthly?.forEach((m) => {
      csv += `${m.month},${m.newMembers},${m.totalMembers}\n`;
    });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="report_${Date.now()}.csv"`
    }
  });
}
