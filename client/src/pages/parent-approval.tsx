import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pass } from "@shared/schema";

export default function ParentApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingPasses = [], isLoading } = useQuery<Pass[]>({
    queryKey: ["/api/passes/status/pending_parent"],
  });

  const approveMutation = useMutation({
    mutationFn: async (passId: string) => {
      const response = await apiRequest("PATCH", `/api/passes/${passId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pass request approved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve pass request." });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (passId: string) => {
      const response = await apiRequest("PATCH", `/api/passes/${passId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pass request rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject pass request." });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Parent Approval Portal</CardTitle>
          <p className="text-muted-foreground">Review and approve home pass requests from your child</p>
        </CardHeader>
        <CardContent>
          {pendingPasses.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-check-circle text-6xl text-emerald-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">No pending approval requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingPasses.map((pass) => (
                <div 
                  key={pass.id} 
                  className="border border-border rounded-lg p-6"
                  data-testid={`pending-pass-${pass.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                        <i className="fas fa-user-graduate text-primary text-lg"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground" data-testid={`student-name-${pass.id}`}>
                          {pass.studentName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          <span data-testid={`class-${pass.id}`}>{pass.class}</span> • 
                          <span className="ml-1" data-testid={`digital-id-${pass.id}`}>{pass.digitalId}</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={pass.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        <i className="fas fa-comment-dots mr-2"></i>Reason for Leave
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md" data-testid={`reason-${pass.id}`}>
                        {pass.reason}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        <i className="fas fa-calendar mr-2"></i>Duration
                      </h4>
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span>Departure:</span>
                          <span data-testid={`departure-date-${pass.id}`}>{pass.departureDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Return:</span>
                          <span data-testid={`return-date-${pass.id}`}>{pass.returnDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-md p-4 mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      <i className="fas fa-info-circle mr-2"></i>Request Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Applied:</span>
                        <span className="text-foreground ml-2" data-testid={`applied-date-${pass.id}`}>
                          {new Date(pass.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Request ID:</span>
                        <span className="text-foreground ml-2" data-testid={`pass-id-${pass.id}`}>
                          #{pass.passId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      <i className="fas fa-exclamation-triangle mr-2 text-amber-500"></i>
                      Action required: Approve or reject this request
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(pass.id)}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${pass.id}`}
                      >
                        <i className="fas fa-times mr-2"></i>
                        Reject
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => approveMutation.mutate(pass.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${pass.id}`}
                      >
                        <i className="fas fa-check mr-2"></i>
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
