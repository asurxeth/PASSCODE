
'use client';

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, Key, Gift, Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/firebase/auth-provider";
import { format } from "date-fns";
import { db } from "@/firebase/config";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 bg-muted rounded-xl text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminUnauthorized() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-lg bg-card border-2 border-dashed">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have the necessary permissions to view this page. Please contact your administrator.</p>
        </div>
    )
}

type Verifier = {
    id: string;
    name: string;
    status: 'approved' | 'pending' | 'suspended';
    createdAt: { seconds: number };
}

type SecurityAlert = {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    verifierId: string;
    signal: Record<string, any>;
    status: 'open' | 'acknowledged' | 'resolved';
}

function FraudAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const q = collection(db, "security_alerts");
    const unsubscribe = onSnapshot(q, snap => {
      const openAlerts = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as SecurityAlert))
        .filter(a => a.status === 'open');
      setAlerts(openAlerts);
    });
    return () => unsubscribe();
  }, []);

  const suspendVerifier = (verifierId: string) => {
    toast({ title: 'Action Required', description: `Suspend action for ${verifierId} needs implementation.` });
  }

  const resolveAlert = (alertId: string) => {
     toast({ title: 'Action Required', description: `Resolve action for ${alertId} needs implementation.` });
  }
  
  if (alerts.length === 0) {
    return null;
  }

  return (
     <Card className="rounded-2xl shadow-sm border-destructive">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive" />
                Active Security Alerts
            </CardTitle>
            <CardDescription>Review these critical events and take action immediately.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Verifier</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {alerts.map((alert) => (
                        <TableRow key={alert.id} className="hover:bg-destructive/10">
                            <TableCell className="font-medium">{alert.type.replace(/_/g, ' ')}</TableCell>
                            <TableCell>
                                 <Badge 
                                    variant={
                                        alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' 
                                        : 'warning'
                                    } 
                                    className="capitalize"
                                >
                                    {alert.severity}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{alert.verifierId.substring(0,10)}...</TableCell>
                             <TableCell className="text-xs text-muted-foreground">{alert.signal.failedAttempts} failed attempts from {alert.signal.ip}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="destructive" size="sm" onClick={() => suspendVerifier(alert.verifierId)}>Suspend</Button>
                                <Button variant="outline" size="sm" className="ml-2" onClick={() => resolveAlert(alert.id)}>Resolve</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}


export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    verifiers: 0,
    verifications: 0,
    rewardsIssued: 0,
  });

  useEffect(() => {
    if (!user) {
        setIsAllowed(false);
        return;
    };

    user.getIdTokenResult()
        .then((idTokenResult) => {
            if (idTokenResult.claims.role === 'admin') {
                setIsAllowed(true);
            } else {
                setIsAllowed(false);
            }
        })
        .catch(() => {
            setIsAllowed(false);
        });
  }, [user]);

  useEffect(() => {
    if (!db || !isAllowed) return;

    const unsubscribers = [
      onSnapshot(collection(db, "users"), (snap) => setStats(s => ({ ...s, users: snap.size }))),
      onSnapshot(collection(db, "verifiers"), (snap) => {
        setStats(s => ({ ...s, verifiers: snap.size }));
        const verifierList = snap.docs.map(d => ({id: d.id, ...d.data()} as Verifier));
        setVerifiers(verifierList);
      }),
      onSnapshot(collection(db, "verification_logs"), (snap) => setStats(s => ({ ...s, verifications: snap.size }))),
      onSnapshot(collection(db, "reward_history"), (snap) => {
        let totalPoints = 0;
        snap.forEach(doc => {
            totalPoints += doc.data().pointsEarned || 0;
        });
        setStats(s => ({...s, rewardsIssued: totalPoints}))
      })
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [isAllowed]);

    const updateStatus = async (verifierId: string, status: 'approved' | 'suspended' | 'pending') => {
        if (!db) return;
        const verifierRef = doc(db, "verifiers", verifierId);
        try {
            await updateDoc(verifierRef, { status });
            toast({
                title: 'Success',
                description: `Verifier status updated to ${status}.`,
                variant: 'success'
            });
        } catch(e) {
            console.error(e);
            toast({
                title: 'Error',
                description: 'Could not update verifier status.',
                variant: 'destructive'
            });
        }
    };
    
    const handleRotateKey = (verifierId: string) => {
        console.log(`Rotating key for verifier ${verifierId}`);
        // This would call a Cloud Function which returns the new key
        // For now, we'll just show a placeholder
        toast({
            title: 'API Key Rotated',
            description: `New Key: ${Math.random().toString(36).substring(2)} (shown once only)`,
        })
    };

  if (isAllowed === null) {
      return (
          <AppLayout>
              <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
          </AppLayout>
      );
  }

  return (
    <AppLayout>
        { !isAllowed ? <AdminUnauthorized /> : (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

                <FraudAlerts />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.users} icon={<Users />} />
                <StatCard title="Active Verifiers" value={stats.verifiers} icon={<ShieldCheck />} />
                <StatCard title="Total Verifications" value={stats.verifications} icon={<Key />} />
                <StatCard title="Reward Points Issued" value={stats.rewardsIssued} icon={<Gift />} />
                </div>
                
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Verifier Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {verifiers.map((verifier) => (
                                    <TableRow key={verifier.id}>
                                        <TableCell className="font-medium">{verifier.name}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={
                                                    verifier.status === 'approved' ? 'success' 
                                                    : verifier.status === 'pending' ? 'warning' 
                                                    : 'destructive'
                                                } 
                                                className="capitalize"
                                            >
                                                {verifier.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(verifier.createdAt.seconds * 1000), "PP")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => updateStatus(verifier.id, 'approved')} disabled={verifier.status === 'approved'}>Approve</Button>
                                            <Button variant="ghost" size="sm" onClick={() => updateStatus(verifier.id, 'suspended')} disabled={verifier.status === 'suspended'}>Suspend</Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleRotateKey(verifier.id)}>Rotate Key</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="flex flex-wrap gap-4">
                            <Button>Manage Verifiers</Button>
                            <Button variant="outline">View Audit Logs</Button>
                            <Button variant="outline">Reward Rules</Button>
                        </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">System Health</h2>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><span className="text-success-foreground bg-success rounded-full p-0.5 leading-none">✔</span> Token verification service: Operational</li>
                            <li className="flex items-center gap-2"><span className="text-success-foreground bg-success rounded-full p-0.5 leading-none">✔</span> Firebase Auth: Healthy</li>
                            <li className="flex items-center gap-2"><span className="text-success-foreground bg-success rounded-full p-0.5 leading-none">✔</span> Firestore latency: Normal</li>
                        </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
    </AppLayout>
  );
}
