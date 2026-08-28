import { NextRequest, NextResponse } from 'next/server';
import { getReportsCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET /api/reports/[id]/export?format=json|csv
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const { isMongo, collection, inMemoryStore } = await getReportsCollection();

    let report: any = null;
    if (isMongo && collection) {
      report = await collection.findOne({
        $or: [{ reportId: id }, { _id: id }],
      } as any);
    } else {
      report = inMemoryStore?.find((r) => r.reportId === id || r._id === id);
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (format === 'csv') {
      const rows = report.data || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        return new NextResponse('No record data available for CSV export', {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(',')];

      rows.forEach((row: any) => {
        const line = headers
          .map((h) => {
            const val = row[h] !== undefined && row[h] !== null ? String(row[h]).replace(/"/g, '""') : '';
            return `"${val}"`;
          })
          .join(',');
        csvLines.push(line);
      });

      const csvContent = csvLines.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report.reportId || 'report'}.csv"`,
        },
      });
    }

    // JSON export format
    return new NextResponse(JSON.stringify(report, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${report.reportId || 'report'}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Export report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export report' }, { status: 500 });
  }
}
