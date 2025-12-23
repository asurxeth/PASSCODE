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
  input: {schema: VerificationAuditLogsInputSchema},
  output: {schema: VerificationAuditLogsOutputSchema},
  prompt: `You are an expert admin assistant. Your job is to summarize verification logs based on the query provided by the admin.

  Query: {{{query}}}
  `,
});

const verificationAuditLogsFlow = ai.defineFlow(
  {
    name: 'verificationAuditLogsFlow',
    inputSchema: VerificationAuditLogsInputSchema,
    outputSchema: VerificationAuditLogsOutputSchema,
  },
  async input => {
    const {output} = await summarizeLogsPrompt(input);
    return output!;
  }
);
