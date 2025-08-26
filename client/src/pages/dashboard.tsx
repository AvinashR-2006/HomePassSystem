import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pass } from "@shared/schema";

export default function Dashboard() {
  const { data: passes = [], isLoading } = useQuery<Pass[]>({
    queryKey: ["/api/passes"],
  });

  const { data: stats } = useQuery<{
    total: number;
    pending: number;
    approved: number;
    issued: number;
    active: number;
    rejected: number;
  }>({
    queryKey: ["/api/passes/stats"],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-4">Smart Digital Home Pass System</h1>
        <p className="text-lg opacity-90 mb-6">Streamlined digital pass management for educational institutions</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold" data-testid="stat-total">{stats?.total || 0}</div>
            <div className="text-sm opacity-80">Total Passes</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold" data-testid="stat-pending">{stats?.pending || 0}</div>
            <div className="text-sm opacity-80">Pending Approval</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold" data-testid="stat-approved">{stats?.approved || 0}</div>
            <div className="text-sm opacity-80">Approved</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold" data-testid="stat-active">{stats?.active || 0}</div>
            <div className="text-sm opacity-80">Currently Active</div>
          </div>
        </div>
      </div>

      {/* Live Passes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Live Pass Tracking</CardTitle>
          <p className="text-sm text-muted-foreground">Real-time status of all digital home passes</p>
        </CardHeader>
        <CardContent>
          {passes.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Passes Yet</h3>
              <p className="text-muted-foreground">Pass requests will appear here once students apply.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {passes.map((pass) => (
                    <tr key={pass.id} data-testid={`pass-row-${pass.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <i className="fas fa-user text-primary"></i>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground" data-testid={`student-name-${pass.id}`}>
                              {pass.studentName}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`digital-id-${pass.id}`}>
                              {pass.digitalId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`class-${pass.id}`}>
                        {pass.class}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground" data-testid={`reason-${pass.id}`}>
                        {pass.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={pass.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`applied-date-${pass.id}`}>
                        {new Date(pass.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-primary hover:text-primary/80 mr-3"
                          data-testid={`view-pass-${pass.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="text-muted-foreground hover:text-foreground"
                          data-testid={`download-pass-${pass.id}`}
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
