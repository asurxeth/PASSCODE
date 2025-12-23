'use client';

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, Key, Gift } from "lucide-react";
import { AppLayout } from "@/components/app-layout";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    verifiers: 0,
    verifications: 0,
    rewardsIssued: 0,
  });

  useEffect(() => {
    // In a real app, you would fetch these stats from your backend.
    // For now, we are using mock data.
    setStats({
      users: 12450,
      verifiers: 37,
      verifications: 68210,
      rewardsIssued: 682100,
    });
  }, []);

  return (
    <AppLayout>
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
                <li className="flex items-center gap-2"><span className="text-success">✔</span> Token verification service: Operational</li>
                <li className="flex items-center gap-2"><span className="text-success">✔</span> Firebase Auth: Healthy</li>
                <li className="flex items-center gap-2"><span className="text-success">✔</span> Firestore latency: Normal</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}