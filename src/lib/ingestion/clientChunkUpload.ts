import { INGESTION_BATCH_SIZE } from './constants';

interface ProcessInChunksOptions {
  statementId?: string;
  onLogMessage?: (message: string) => void;
  onProgressPercentage?: (percentage: number) => void;
}

export async function processInChunks<T>(
  parsedRows: T[],
  options: ProcessInChunksOptions = {}
): Promise<void> {
  let processedCount = 0;

  for (let i = 0; i < parsedRows.length; i += INGESTION_BATCH_SIZE) {
    const chunk = parsedRows.slice(i, i + INGESTION_BATCH_SIZE);
    const start = i + 1;
    const end = Math.min(i + INGESTION_BATCH_SIZE, parsedRows.length);

    options.onLogMessage?.(`Analyzing transactions ${start} to ${end}...`);

    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statementId: options.statementId,
        transactions: chunk,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Chunk processing failed');
    }

    processedCount += chunk.length;
    options.onProgressPercentage?.((processedCount / parsedRows.length) * 100);
  }

  options.onLogMessage?.('Generating financial wellness insights...');

  const response = await fetch('/api/insights/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statementId: options.statementId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Insight generation failed');
  }
}
