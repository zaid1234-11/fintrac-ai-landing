import { Inngest } from 'inngest';

// Initialize Inngest client with unique application identifier
export const inngest = new Inngest({ 
  id: 'fintrac-ai-pipeline',
  name: 'FinTrac AI Ingestion Engine',
  eventKey: process.env.INNGEST_EVENT_KEY || 'local-event-key'
});
