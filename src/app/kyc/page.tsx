import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { File, Upload } from 'lucide-react';

const userKyc = {
  name: 'Jane Doe',
  dob: '1990-05-15',
  idNumber: 'A1234567B',
  address: '123, Blossom Park, S123456',
};

const documents = [
  { name: 'Passport.pdf', type: 'Passport' },
  { name: 'Utility_Bill.pdf', type: 'Proof of Address' },
];

export default function KycPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Details</h1>
            <p className="text-muted-foreground">Manage your identity verification information.</p>
          </div>
          <Button>Edit Details</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={userKyc.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={userKyc.dob} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input id="idNumber" value={userKyc.idNumber} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={userKyc.address} readOnly />
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
                <li key={doc.name} className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <File className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.type}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </li>
              ))}
            </ul>
            <Separator className="my-6" />
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/50 p-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Drag & drop files here, or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports PDF, JPG, PNG. Max 5MB.</p>
              <Button className="mt-4">Upload Document</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
