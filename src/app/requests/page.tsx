'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

type VerificationRequest = {
  id: string;
  platform: string;
  platformLogo: string;
  platformLogoHint: string;
  requestedFields: string[];
  reason: string;
};

const initialRequests: VerificationRequest[] = [
  { 
    id: 'REQ001', 
    platform: 'Fintech X', 
    platformLogo: PlaceHolderImages.find(p => p.id === 'fintech-x-logo')?.imageUrl || '',
    platformLogoHint: PlaceHolderImages.find(p => p.id === 'fintech-x-logo')?.imageHint || 'company logo',
    requestedFields: ['Full Name', 'ID Number'], 
    reason: 'For account opening' 
  },
  { 
    id: 'REQ002', 
    platform: 'Marketplace Y', 
    platformLogo: PlaceHolderImages.find(p => p.id === 'marketplace-y-logo')?.imageUrl || '',
    platformLogoHint: PlaceHolderImages.find(p => p.id === 'marketplace-y-logo')?.imageHint || 'company logo',
    requestedFields: ['Full Name', 'Address'], 
    reason: 'For delivery verification' 
  },
  { 
    id: 'REQ003', 
    platform: 'Rental Z', 
    platformLogo: PlaceHolderImages.find(p => p.id === 'rental-z-logo')?.imageUrl || '',
    platformLogoHint: PlaceHolderImages.find(p => p.id === 'rental-z-logo')?.imageHint || 'company logo',
    requestedFields: ['Full Name', 'DOB', 'ID Number'], 
    reason: 'To verify age and identity for rental agreement' 
  },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, you'd fetch these from a server.
    const storedRequests = localStorage.getItem('verificationRequests');
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    } else {
      setRequests(initialRequests);
    }
  }, []);

  const updateLocalStorage = (updatedRequests: VerificationRequest[]) => {
    localStorage.setItem('verificationRequests', JSON.stringify(updatedRequests));
  };
  
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

  const handleApprove = (request: VerificationRequest) => {
    setSelectedRequest(request);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setVerificationCode(code);
    
    const newActiveConsents = JSON.parse(localStorage.getItem('activeConsents') || '[]');
    const newConsent = {
      id: `C${(newActiveConsents.length + 1).toString().padStart(3, '0')}`,
      platform: request.platform,
      granted: new Date().toISOString(),
      fields: request.requestedFields,
      logo: request.platformLogo,
      logoHint: request.platformLogoHint,
    };
    localStorage.setItem('activeConsents', JSON.stringify([newConsent, ...newActiveConsents]));
    
    logAuditEvent('Consent Granted', request.platform, `Shared: ${request.requestedFields.join(', ')}`);
    
    const updatedRequests = requests.filter(r => r.id !== request.id);
    setRequests(updatedRequests);
    updateLocalStorage(updatedRequests);
    setShowTokenDialog(true);
    toast({
        title: 'Request Approved',
        description: `Data sharing consent granted to ${request.platform}.`,
        variant: 'success',
    });
  };

  const handleDeny = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if(request) {
        logAuditEvent('Consent Denied', request.platform, `Denied request for: ${request.requestedFields.join(', ')}`);
        const updatedRequests = requests.filter(r => r.id !== requestId);
        setRequests(updatedRequests);
        updateLocalStorage(updatedRequests);
        toast({
            title: 'Request Denied',
            description: `Data sharing consent denied for ${request.platform}.`,
            variant: 'destructive',
        });
    }
  };

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
                  <Image src={request.platformLogo} alt={`${request.platform} logo`} width={40} height={40} className="h-10 w-10 rounded-full" data-ai-hint={request.platformLogoHint} />
                  <div>
                    <CardTitle>{request.platform}</CardTitle>
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
                  <h4 className="font-semibold mt-4 mb-2">Reason:</h4>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleDeny(request.id)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Deny
                  </Button>
                  <Button onClick={() => handleApprove(request)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
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
              Share this one-time code with <span className="font-bold">{selectedRequest?.platform}</span>. It will expire in 5 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex items-center justify-center bg-muted p-8 rounded-lg">
            <p className="text-4xl font-bold tracking-widest font-mono">{verificationCode}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTokenDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
