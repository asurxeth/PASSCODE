
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getVerificationAuditLogsSummary } from '@/ai/flows/verification-audit-logs';
import { Bot, Search, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/firebase/auth-provider';
import { db, collection, query, where, onSnapshot, doc, getDoc, orderBy, isConfigValid } from '@/firebase';

type AuditLog = {
  id: string;
  requestId: string;
  verifierId: string;
  platformName?: string;
  timestamp: { seconds: number };
  verifiedFields: string[];
};

type AuditQueryForm = {
  query: string;
};

export default function AuditsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<AuditQueryForm>();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!user || !db) return;

    const logsQuery = query(
      collection(db, 'verification_logs'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(logsQuery, async (snapshot) => {
      const fetchedLogs = await Promise.all(
        snapshot.docs.map(async (docData) => {
          const log = { id: docData.id, ...docData.data() } as AuditLog;
          const verifierSnap = await getDoc(doc(db, 'verifiers', log.verifierId));
          if (verifierSnap.exists()) {
            log.platformName = verifierSnap.data().name;
          }
          return log;
        })
      );
      setAuditLogs(fetchedLogs);
    });

    return () => unsubscribe();
  }, [user]);

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

  if (!isConfigValid) {
    return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Firebase Not Configured</AlertTitle>
          <AlertDescription>
            Please add your Firebase project credentials to the `.env` file to see this page.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
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
                        <Badge variant={'success'}>
                          KYC Data Shared
                        </Badge>
                      </TableCell>
                      <TableCell>{log.platformName}</TableCell>
                      <TableCell>{format(new Date(log.timestamp.seconds * 1000), "PPp")}</TableCell>
                      <TableCell className="text-muted-foreground">{`Shared: ${log.verifiedFields.join(', ')}`}</TableCell>
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
