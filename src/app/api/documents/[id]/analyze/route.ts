import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { analyzeDocumentContent } from '@/lib/aiAnalyzer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Trigger AI analysis pipeline
    const analysisResult = await analyzeDocumentContent(id);

    return NextResponse.json({
      message: 'AI document analysis completed successfully',
      analysis: analysisResult,
    });
  } catch (error: any) {
    console.error('Trigger AI analysis error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze document' }, { status: 500 });
  }
}
