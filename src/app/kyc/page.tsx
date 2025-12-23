
'use client';

import { useEffect, useState, useRef } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { File, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/firebase/auth-provider';
import { db, storage, onSnapshot, doc, setDoc, collection, serverTimestamp, uploadBytes, ref, getDownloadURL, isConfigValid } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

type UserProfile = {
  fullName: string;
  dob: string;
  idNumber: string;
  address: string;
};

type KycDocument = {
  id: string;
  name: string;
  type: string;
  url: string;
  status: string;
};

export default function KycPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !db) return;

    const userProfileRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userProfileRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      } else {
        // Create a default profile if it doesn't exist
        const defaultProfile = {
            uid: user.uid,
            fullName: user.displayName || 'Jane Doe',
            email: user.email || '',
            role: 'user',
            kycStatus: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            dob: '1990-05-15',
            idNumber: 'A1234567B',
            address: '123, Blossom Park, S123456',
        }
        setDoc(userProfileRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    });

    const documentsRef = collection(db, 'kyc_documents');
    const unsubscribeDocs = onSnapshot(documentsRef, (snapshot) => {
      const docs = snapshot.docs
        .filter(doc => doc.data().userId === user.uid)
        .map(doc => ({ id: doc.id, ...doc.data() } as KycDocument));
      setDocuments(docs);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeDocs();
    };
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, [e.target.id]: e.target.value });
    }
  };

  const handleSave = async () => {
    if (!user || !userProfile || !db) return;
    const userProfileRef = doc(db, 'users', user.uid);
    await setDoc(userProfileRef, { ...userProfile, updatedAt: serverTimestamp() }, { merge: true });
    setIsEditing(false);
    toast({ title: 'Success', description: 'Your profile has been updated.', variant: 'success' });
  };
  
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage || !db) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `kyc/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const docRef = doc(collection(db, 'kyc_documents'));
      await setDoc(docRef, {
        userId: user.uid,
        name: file.name,
        type: 'General', // Or derive from UI
        url: downloadURL,
        storagePath: storageRef.fullPath,
        status: 'pending',
        uploadedAt: serverTimestamp(),
      });

      toast({ title: 'Upload Successful', description: `${file.name} has been uploaded.`, variant: 'success' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Upload Failed', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Details</h1>
            <p className="text-muted-foreground">Manage your identity verification information.</p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={userProfile?.fullName || ''} readOnly={!isEditing} onChange={handleProfileChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={userProfile?.dob || ''} readOnly={!isEditing} onChange={handleProfileChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input id="idNumber" value={userProfile?.idNumber || ''} readOnly={!isEditing} onChange={handleProfileChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={userProfile?.address || ''} readOnly={!isEditing} onChange={handleProfileChange} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>These documents are stored securely and shared only with your consent.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <File className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{doc.status}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                  </Button>
                </li>
              ))}
            </ul>
            <Separator className="my-6" />
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/50 p-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Drag & drop files here, or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports PDF, JPG, PNG. Max 5MB.</p>
               <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button className="mt-4" onClick={handleFileSelect} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Document"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
