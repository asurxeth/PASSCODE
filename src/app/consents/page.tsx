
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Trash2, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/firebase/auth-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { db, isConfigValid } from '@/firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';

type ActiveConsent = {
  id: string; // This will be the kyc_request ID
  platform: string;
  granted: string;
  fields: string[];
  logo: string;
  logoHint: string;
  verifierId: string;
};

export default function ConsentsPage() {
  const { user } = useAuth();
  const [activeConsents, setActiveConsents] = useState<ActiveConsent[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !db) return;

    const consentsQuery = query(
      collection(db, 'kyc_requests'),
      where('userId', '==', user.uid),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(consentsQuery, async (snapshot) => {
      const fetchedConsents = await Promise.all(
        snapshot.docs.map(async (docData) => {
          const request = { id: docData.id, ...docData.data() };
          const verifierSnap = await getDoc(doc(db, 'verifiers', request.verifierId));
          let platformName = 'Unknown Platform';
          const placeholderLogo = PlaceHolderImages.find(p => p.id.includes('company'))
          let platformLogo = placeholderLogo?.imageUrl || `https://picsum.photos/seed/${request.verifierId}/40/40`;
          let logoHint = placeholderLogo?.imageHint || 'company logo';

          if (verifierSnap.exists()) {
            const verifierData = verifierSnap.data();
            platformName = verifierData.name;
            const specificLogo = PlaceHolderImages.find(p => p.id.includes(platformName.toLowerCase().split(' ')[0]));
            if (specificLogo) {
                platformLogo = specificLogo.imageUrl;
                logoHint = specificLogo.imageHint;
            }
          }

          return {
            id: request.id,
            platform: platformName,
            granted: request.createdAt.toDate().toISOString(),
            fields: request.requestedFields,
            logo: platformLogo,
            logoHint: logoHint,
            verifierId: request.verifierId,
          } as ActiveConsent;
        })
      );
      setActiveConsents(fetchedConsents);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRevoke = async (consentId: string) => {
    if (!db) return;
    setLoading(prev => ({...prev, [consentId]: true}));
    try {
      const consent = activeConsents.find(c => c.id === consentId);
      await deleteDoc(doc(db, 'kyc_requests', consentId));
      toast({
        title: 'Consent Revoked',
        description: `Your data is no longer shared with ${consent?.platform}.`,
        variant: 'destructive'
      });
    } catch (error) {
       toast({
        title: 'Error',
        description: `Could not revoke consent.`,
        variant: 'destructive'
      });
    } finally {
        setLoading(prev => ({...prev, [consentId]: false}));
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
                        <Button variant="destructive" disabled={loading[consent.id]}>
                            {loading[consent.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
