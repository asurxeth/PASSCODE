'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getVerificationAuditLogsSummary } from '@/ai/flows/verification-audit-logs';
import { Bot, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type AuditLog = {
  id: string;
  event: string;
  date: string;
  platform: string;
  details: string;
};

const initialAuditLogs: AuditLog[] = [
  { id: 'L001', event: 'KYC Data Shared', date: '2023-10-26T10:05:00Z', platform: 'Fintech App', details: 'Shared: Full Name, ID Number' },
  { id: 'L002', event: 'KYC Data Shared', date: '2023-10-25T15:20:00Z', platform: 'E-commerce Site', details: 'Shared: Full Name, Address' },
  { id: 'L003', event: 'Request Denied', date: '2023-10-25T09:15:00Z', platform: 'Social Media Co', details: '-' },
  { id: 'L004', event: 'KYC Details Updated', date: '2023-10-23T11:00:00Z', platform: 'User Action', details: 'Address updated' },
  { id: 'L005', event: 'KYC Data Shared', date: '2023-10-22T20:45:00Z', platform: 'Crypto Exchange', details: 'Shared: Full Name, DOB, ID' },
];

type AuditQueryForm = {
  query: string;
};

export default function AuditsPage() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<AuditQueryForm>();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('auditLogs');
    if (storedLogs) {
      setAuditLogs(JSON.parse(storedLogs));
    } else {
      localStorage.setItem('auditLogs', JSON.stringify(initialAuditLogs));
      setAuditLogs(initialAuditLogs);
    }
  }, []);

  const onQuerySubmit = async (data: AuditQueryForm) => {
    if (!data.query) return;
    setIsLoading(true);
    setSummary('');
    try {
      const result = await getVerificationAuditLogsSummary({ query: data.query });
      setSummary(result.summary);
    } catch (error) {
      console.error(error);
      setSummary('Sorry, I could not generate a summary. Please try again.');
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  const getBadgeVariant = (event: string) => {
    if (event.includes('Granted') || event.includes('Shared')) return 'success';
    if (event.includes('Denied') || event.includes('Revoked')) return 'destructive';
    return 'secondary';
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">A detailed history of all activities on your account.</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="text-primary" />
              AI-Powered Audit Summary
            </CardTitle>
            <CardDescription>Ask a question about your audit history in plain English. For example, "Show me all data shared this week".</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onQuerySubmit)} className="flex items-center gap-2">
              <Input
                {...register('query')}
                placeholder="e.g., How many times was my data shared with Fintech App?"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="sr-only">Query</span>
              </Button>
            </form>
            { (isLoading || summary) && (
              <div className="mt-4 rounded-lg border bg-muted/50 p-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating summary...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{summary}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={getBadgeVariant(log.event)}>
                          {log.event}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.platform}</TableCell>
                      <TableCell>{format(new Date(log.date), "PPp")}</TableCell>
                      <TableCell className="text-muted-foreground">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
