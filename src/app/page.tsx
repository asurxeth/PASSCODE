
'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Award, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/firebase/auth-provider';
import { format } from 'date-fns';
import { db, isConfigValid } from '@/firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';


type Verification = {
  id: string;
  verifierId: string;
  platformName?: string;
  createdAt: { seconds: number };
  status: string;
};

type Reward = {
  points: number;
  tier: string;
  totalVerifications: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentVerifications, setRecentVerifications] = useState<Verification[]>([]);
  const [rewardData, setRewardData] = useState<Reward | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const verificationsQuery = query(
      collection(db, 'kyc_requests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeVerifications = onSnapshot(verificationsQuery, async (snapshot) => {
      const verifications = await Promise.all(
        snapshot.docs.map(async (docData) => {
          const data = docData.data();
          let platformName = 'Unknown';
          if (data.verifierId) {
            const verifierSnap = await getDoc(doc(db, 'verifiers', data.verifierId));
            if (verifierSnap.exists()) {
              platformName = verifierSnap.data().name;
            }
          }
          return {
            id: docData.id,
            platformName,
            ...data,
          } as Verification;
        })
      );
      setRecentVerifications(verifications);
    });

    const rewardRef = doc(db, 'rewards', user.uid);
    const unsubscribeRewards = onSnapshot(rewardRef, (doc) => {
      if (doc.exists()) {
        setRewardData(doc.data() as Reward);
      }
    });

    return () => {
      unsubscribeVerifications();
      unsubscribeRewards();
    };
  }, [user]);

  const getTierProgress = () => {
    if (!rewardData) return 0;
    if (rewardData.tier === 'gold') return 100;
    if (rewardData.tier === 'silver') return ((rewardData.totalVerifications) / 20) * 100;
    return (rewardData.totalVerifications / 10) * 100;
  };
  
  const verificationsToNextTier = () => {
    if(!rewardData) return 10;
    if(rewardData.tier === 'bronze') return 10 - rewardData.totalVerifications;
    if(rewardData.tier === 'silver') return 20 - rewardData.totalVerifications;
    return 0;
  }

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
      <div className="grid gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your KYC summary.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewardData?.points ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Verification Tier</CardTitle>
              <CardDescription className="capitalize">{rewardData?.tier ?? 'Bronze'} Tier</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={getTierProgress()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {rewardData?.tier === 'gold' ? "You've reached the highest tier!" : `${verificationsToNextTier()} more verifications to next tier`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewardData?.totalVerifications ?? 0}</div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of your recent verification activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-medium">{verification.id.substring(0,6)}...</TableCell>
                    <TableCell>{verification.platformName}</TableCell>
                    <TableCell>{format(new Date(verification.createdAt.seconds * 1000), 'PP')}</TableCell>
                    <TableCell>
                       <Badge
                        variant={
                          verification.status === 'approved' ? 'success' :
                          verification.status === 'pending' ? 'warning' :
                          'destructive'
                        }
                        className="capitalize"
                      >
                        {verification.status === 'approved' ? <CheckCircle className="mr-1 h-3 w-3" /> :
                        verification.status === 'pending' ? <Clock className="mr-1 h-3 w-3" /> :
                        <XCircle className="mr-1 h-3 w-3" />}
                        {verification.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
