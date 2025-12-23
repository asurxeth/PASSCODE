
'use client';

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, Key, Gift, Loader2, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { db, collection, onSnapshot } from '@/firebase';
import { useAuth } from "@/firebase/auth-provider";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
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
      onSnapshot(collection(db, "verifiers"), (snap) => setStats(s => ({ ...s, verifiers: snap.size }))),
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.users} icon={<Users />} />
                <StatCard title="Active Verifiers" value={stats.verifiers} icon={<ShieldCheck />} />
                <StatCard title="Total Verifications" value={stats.verifications} icon={<Key />} />
                <StatCard title="Reward Points Issued" value={stats.rewardsIssued} icon={<Gift />} />
                </div>

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
