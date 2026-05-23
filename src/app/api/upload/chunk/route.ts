import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { IngestibleTransaction, persistTransactionChunk, INGESTION_BATCH_SIZE } from '@/lib/ingestion/chunkPersistence';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const transactions = body.transactions as IngestibleTransaction[] | undefined;
    const statementId = body.statementId as string | undefined;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'transactions must be a non-empty array' },
        { status: 400 }
      );
    }

    if (transactions.length > INGESTION_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Chunk size exceeds ${INGESTION_BATCH_SIZE} transactions` },
        { status: 413 }
      );
    }

    const supabase = await createClient();
    const result = await persistTransactionChunk({
      supabase,
      userId,
      statementId,
      transactions,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }

    console.error('[Upload Chunk API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Chunk processing failed' },
      { status: 500 }
    );
  }
}
