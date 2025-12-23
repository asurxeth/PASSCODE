
'use server';

/**
 * @fileOverview This file defines a Genkit flow for querying and summarizing verification audit logs.
 *
 * It includes:
 * - `getVerificationAuditLogsSummary` -  A function that takes a natural language query and returns a summarized report of verification logs.
 * - `VerificationAuditLogsInput` - The input type for the `getVerificationAuditLogsSummary` function.
 * - `VerificationAuditLogsOutput` - The output type for the `getVerificationAuditLogsSummary` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminDb } from '@/firebase-admin/config';

const VerificationAuditLogsInputSchema = z.object({
  query: z.string().describe('A natural language query to summarize the verification logs.'),
});
export type VerificationAuditLogsInput = z.infer<typeof VerificationAuditLogsInputSchema>;

const VerificationAuditLogsOutputSchema = z.object({
  summary: z.string().describe('A summarized report of the verification logs based on the query.'),
});
export type VerificationAuditLogsOutput = z.infer<typeof VerificationAuditLogsOutputSchema>;

export async function getVerificationAuditLogsSummary(
  input: VerificationAuditLogsInput
): Promise<VerificationAuditLogsOutput> {
  return verificationAuditLogsFlow(input);
}

const summarizeLogsPrompt = ai.definePrompt({
  name: 'summarizeLogsPrompt',
  input: {schema: z.object({
    query: z.string(),
    logs: z.string(),
  })},
  output: {schema: VerificationAuditLogsOutputSchema},
  prompt: `You are an expert admin assistant. Your job is to summarize verification logs based on the query provided by the admin.
  The user has provided the following query:
  "{{{query}}}"

  Here are the relevant logs from the database, in JSON format:
  {{{logs}}}

  Analyze the logs and provide a concise summary that directly answers the user's query.
  `,
});

const verificationAuditLogsFlow = ai.defineFlow(
  {
    name: 'verificationAuditLogsFlow',
    inputSchema: VerificationAuditLogsInputSchema,
    outputSchema: VerificationAuditLogsOutputSchema,
  },
  async ({ query }) => {
    // In a real application, you might filter logs based on the query.
    // For this example, we'll fetch all logs.
    const logsSnapshot = await adminDb.collection('verification_logs').orderBy('timestamp', 'desc').limit(50).get();
    const logs = logsSnapshot.docs.map(doc => doc.data());
    
    // Replace Timestamps with serializable strings
    const serializableLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp.toDate().toISOString(),
    }))
    
    const {output} = await summarizeLogsPrompt({
      query,
      logs: JSON.stringify(serializableLogs, null, 2),
    });
    return output!;
  }
);
