import { serve } from 'inngest/next';
import { inngest } from '@/lib/jobs/inngest-client';
import { processStatementUpload, recalculateUserInsights, monthlyFrictionUpdate } from '@/lib/jobs/functions';

export const dynamic = "force-dynamic";

// Expose the Inngest API endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processStatementUpload,
    recalculateUserInsights,
    monthlyFrictionUpdate,
  ],
});
