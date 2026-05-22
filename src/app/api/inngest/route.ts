import { serve } from 'inngest/next';
import { inngest } from '@/lib/jobs/inngest-client';
import { processStatementUpload } from '@/lib/jobs/functions';

// Expose the Inngest API endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processStatementUpload,
  ],
});
