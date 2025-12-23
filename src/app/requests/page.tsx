
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, FileText, Loader2, AlertTriangle, Copy } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase/auth-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import QRCode from 'qrcode';
import { db, isConfigValid } from '@/firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';


type VerificationRequest = {
  id: string;
  verifierId: string;
  platformName?: string;
  platformLogo?: string;
  platformLogoHint?: string;
  requestedFields: string[];
  reason: string;
  status: string;
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !db) return;

    const requestsQuery = query(
      collection(db, 'kyc_requests'),
      where('userId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const fetchedRequests = await Promise.all(
        snapshot.docs.map(async (docData) => {
          const request = { id: docData.id, ...docData.data() } as VerificationRequest;
          const verifierSnap = await getDoc(doc(db, 'verifiers', request.verifierId));
          if (verifierSnap.exists()) {
            const verifierData = verifierSnap.data();
            request.platformName = verifierData.name;
            const placeholderLogo = PlaceHolderImages.find(p => p.id.includes('company'))
            let platformLogo = placeholderLogo?.imageUrl || `https://picsum.photos/seed/${verifierSnap.id}/40/40`;
            let logoHint = placeholderLogo?.imageHint || 'company logo';

            const specificLogo = PlaceHolderImages.find(p => p.id.includes(verifierData.name.toLowerCase().split(' ')[0]));
            if (specificLogo) {
                platformLogo = specificLogo.imageUrl;
                logoHint = specificLogo.imageHint;
            }
            request.platformLogo = platformLogo;
            request.platformLogoHint = logoHint;
          }
          return request;
        })
      );
      setRequests(fetchedRequests);
    });

    return () => unsubscribe();
  }, [user]);

  const generateQrCode = async (text: string) => {
    try {
      const url = await QRCode.toDataURL(text);
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error(err);
      toast({
        title: 'QR Code Error',
        description: 'Could not generate QR code.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (request: VerificationRequest) => {
    if (!user) return;
    setLoading(prev => ({ ...prev, [request.id]: true }));
    setSelectedRequest(request);

    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/kyc/approve-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ requestId: request.id }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to approve request.');
        }

        setVerificationCode(data.token);
        await generateQrCode(data.token);
        setShowTokenDialog(true);
        toast({
            title: 'Request Approved',
            description: `Data sharing consent granted to ${request.platformName}.`,
            variant: 'success',
        });
    } catch (error: any) {
        toast({
            title: 'Approval Failed',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setLoading(prev => ({ ...prev, [request.id]: false }));
    }
  };

  const handleDeny = async (requestId: string) => {
    if (!db) return;
    setLoading(prev => ({ ...prev, [requestId]: true }));
    try {
        const request = requests.find(r => r.id === requestId);
        await deleteDoc(doc(db, 'kyc_requests', requestId));
        toast({
            title: 'Request Denied',
            description: `Data sharing consent denied for ${request?.platformName}.`,
            variant: 'destructive',
        });
    } catch (error) {
        toast({ title: 'Error', description: 'Could not deny request.', variant: 'destructive' });
    } finally {
        setLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationCode);
    toast({ title: 'Copied!', description: 'Verification code copied to clipboard.' });
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
          <h1 className="text-3xl font-bold tracking-tight">Verification Requests</h1>
          <p className="text-muted-foreground">Approve or deny requests to share your KYC data.</p>
        </div>
        {requests.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <Card key={request.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                   {request.platformLogo && <Image src={request.platformLogo} alt={`${request.platformName} logo`} width={40} height={40} className="h-10 w-10 rounded-full" data-ai-hint={request.platformLogoHint} />}
                  <div>
                    <CardTitle>{request.platformName || 'Unknown Platform'}</CardTitle>
                    <CardDescription>is requesting your information</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <h4 className="font-semibold mb-2">Data requested:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {request.requestedFields.map(field => (
                      <li key={field} className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                  {request.reason && <>
                    <h4 className="font-semibold mt-4 mb-2">Reason:</h4>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                  </>
                  }
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleDeny(request.id)} disabled={loading[request.id]}>
                    {loading[request.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Deny
                  </Button>
                  <Button onClick={() => handleApprove(request)} disabled={loading[request.id]}>
                    {loading[request.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Approve
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center mt-8">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">All Clear!</h3>
            <p className="mt-2 text-sm text-muted-foreground">You have no pending verification requests.</p>
          </div>
        )}
      </div>

      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verification Code Generated</DialogTitle>
            <DialogDescription>
              Share this one-time code with <span className="font-bold">{selectedRequest?.platformName}</span>. It will expire in 5 minutes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 flex flex-col items-center justify-center gap-4 bg-muted p-6 rounded-lg">
            {qrCodeDataUrl ? (
              <Image src={qrCodeDataUrl} alt="Verification QR Code" width={200} height={200} />
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <div className="flex items-center gap-2 bg-background p-2 rounded-md">
                <p className="text-xl font-bold tracking-widest font-mono">{verificationCode}</p>
                <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-5 w-5" />
                </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowTokenDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
