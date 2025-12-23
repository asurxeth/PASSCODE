import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle, Clock, XCircle } from 'lucide-react';

const recentVerifications = [
  { id: 'V001', platform: 'Fintech App', date: '2023-10-26', status: 'Approved' },
  { id: 'V002', platform: 'E-commerce Site', date: '2023-10-25', status: 'Approved' },
  { id: 'V003', platform: 'Rental Service', date: '2023-10-24', status: 'Pending' },
  { id: 'V004', platform: 'Social Network', date: '2023-10-23', status: 'Rejected' },
  { id: 'V005', platform: 'Crypto Exchange', date: '2023-10-22', status: 'Approved' },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="grid gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Jane! Here's your KYC summary.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">+50 since last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Verification Tier</CardTitle>
              <CardDescription>Gold Tier</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">750 points to Platinum Tier</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
              <p className="text-xs text-muted-foreground">+3 this month</p>
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
                    <TableCell className="font-medium">{verification.id}</TableCell>
                    <TableCell>{verification.platform}</TableCell>
                    <TableCell>{verification.date}</TableCell>
                    <TableCell>
                       <Badge
                        variant={
                          verification.status === 'Approved' ? 'success' :
                          verification.status === 'Pending' ? 'warning' :
                          'destructive'
                        }
                        className="capitalize"
                      >
                        {verification.status === 'Approved' ? <CheckCircle className="mr-1 h-3 w-3" /> :
                        verification.status === 'Pending' ? <Clock className="mr-1 h-3 w-3" /> :
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
