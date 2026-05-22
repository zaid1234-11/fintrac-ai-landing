import { Inngest } from 'inngest';

// Initialize Inngest client with unique application identifier
export const inngest = new Inngest({ 
  id: 'fintrac-ai-pipeline',
  name: 'FinTrac AI Ingestion Engine'
});
