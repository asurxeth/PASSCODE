'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Trash2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

type ActiveConsent = {
  id: string;
  platform: string;
  granted: string;
  fields: string[];
  logo: string;
  logoHint: string;
};

export default function ConsentsPage() {
  const [activeConsents, setActiveConsents] = useState<ActiveConsent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedConsents = localStorage.getItem('activeConsents');
    if (storedConsents) {
      setActiveConsents(JSON.parse(storedConsents));
    }
  }, []);

  const logAuditEvent = (event: string, platform: string, details: string) => {
    const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const newLog = {
      id: `L${(existingLogs.length + 1).toString().padStart(3, '0')}`,
      event,
      platform,
      details,
      date: new Date().toISOString(),
    };
    localStorage.setItem('auditLogs', JSON.stringify([newLog, ...existingLogs]));
  };

  const handleRevoke = (consentId: string) => {
    const consent = activeConsents.find(c => c.id === consentId);
    if (consent) {
      logAuditEvent('Consent Revoked', consent.platform, `Revoked access to: ${consent.fields.join(', ')}`);
      
      const updatedConsents = activeConsents.filter(c => c.id !== consentId);
      setActiveConsents(updatedConsents);
      localStorage.setItem('activeConsents', JSON.stringify(updatedConsents));

      toast({
        title: 'Consent Revoked',
        description: `Your data is no longer shared with ${consent.platform}.`,
        variant: 'destructive'
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Consents</h1>
          <p className="text-muted-foreground">Manage platforms you are actively sharing data with.</p>
        </div>

        {activeConsents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeConsents.map((consent) => (
              <Card key={consent.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Image src={consent.logo} alt={`${consent.platform} logo`} width={40} height={40} className="h-10 w-10 rounded-full" data-ai-hint={consent.logoHint} />
                  <div>
                    <CardTitle>{consent.platform}</CardTitle>
                    <CardDescription>
                      Consent granted {formatDistanceToNow(new Date(consent.granted), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <h4 className="font-semibold mb-2">Data shared:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {consent.fields.map(field => (
                      <li key={field} className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-end">
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to revoke consent?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will stop sharing your data with <span className="font-bold">{consent.platform}</span>. This action cannot be undone, and they may need to request access again in the future.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(consent.id)}>
                            Yes, Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center mt-8">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Active Consents</h3>
            <p className="mt-2 text-sm text-muted-foreground">You are not currently sharing your data with any platforms.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
