import { NextRequest, NextResponse } from 'next/server';
import { getReportsCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET /api/reports/[id]: Fetch single report from MongoDB
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: 'Report not found in MongoDB' }, { status: 404 });
    }

    return NextResponse.json({ report, isMongoDbConnected: isMongo });
  } catch (error: any) {
    console.error('Fetch single report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch report' }, { status: 500 });
  }
}
