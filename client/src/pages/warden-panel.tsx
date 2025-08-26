import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import type { Pass } from "@shared/schema";

export default function WardenPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: approvedPasses = [], isLoading } = useQuery<Pass[]>({
    queryKey: ["/api/passes/status/approved"],
  });

  const { data: issuedPasses = [] } = useQuery<Pass[]>({
    queryKey: ["/api/passes/status/issued"],
  });

  const { data: activePasses = [] } = useQuery<Pass[]>({
    queryKey: ["/api/passes/status/active"],
  });

  const issuePassMutation = useMutation({
    mutationFn: async (passId: string) => {
      const response = await apiRequest("PATCH", `/api/passes/${passId}/issue`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Digital pass issued successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to issue pass." });
    },
  });

  const allPasses = [...approvedPasses, ...issuedPasses, ...activePasses];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {[1, 2].map((i) => (
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
          <CardTitle className="text-2xl">Warden Control Panel</CardTitle>
          <p className="text-muted-foreground">Review approved requests and issue digital passes</p>
        </CardHeader>
        <CardContent>
          {allPasses.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-clipboard-check text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Approved Passes</h3>
              <p className="text-muted-foreground">Approved pass requests will appear here for issuing.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {allPasses.map((pass) => (
                <div 
                  key={pass.id} 
                  className="border border-border rounded-lg p-6"
                  data-testid={`warden-pass-${pass.id}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Student Information */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                            <i className="fas fa-user-graduate text-primary text-xl"></i>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-foreground" data-testid={`student-name-${pass.id}`}>
                              {pass.studentName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              <span data-testid={`class-${pass.id}`}>{pass.class}</span> • 
                              <span className="ml-1" data-testid={`digital-id-${pass.id}`}>{pass.digitalId}</span>
                            </p>
                            <StatusBadge status={pass.status} className="mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">
                            <i className="fas fa-comment-dots mr-2"></i>Reason
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`reason-${pass.id}`}>
                            {pass.reason}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">
                            <i className="fas fa-calendar mr-2"></i>Duration
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            <span data-testid={`departure-${pass.id}`}>{pass.departureDate}</span> - 
                            <span className="ml-1" data-testid={`return-${pass.id}`}>{pass.returnDate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-md p-3 mb-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Applied:</span>
                            <div className="text-foreground" data-testid={`applied-${pass.id}`}>
                              {new Date(pass.appliedAt).toLocaleDateString()}
                            </div>
                          </div>
                          {pass.approvedAt && (
                            <div>
                              <span className="text-muted-foreground">Approved:</span>
                              <div className="text-foreground" data-testid={`approved-${pass.id}`}>
                                {new Date(pass.approvedAt).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Parent:</span>
                            <div className="text-foreground text-xs" data-testid={`parent-email-${pass.id}`}>
                              {pass.parentEmail}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Generation */}
                    <div className={`rounded-lg p-4 text-center ${
                      pass.status === 'approved' 
                        ? 'bg-muted/20' 
                        : pass.status === 'issued' 
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <h4 className="text-sm font-medium text-foreground mb-3">
                        <i className="fas fa-qrcode mr-2"></i>Digital Pass
                      </h4>
                      
                      {pass.status === 'approved' && (
                        <>
                          <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
                            <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                              <i className="fas fa-qrcode text-4xl text-gray-400"></i>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3" data-testid={`pass-id-${pass.id}`}>
                            Pass ID: {pass.passId}
                          </p>
                          <Button
                            className="w-full mb-2"
                            onClick={() => issuePassMutation.mutate(pass.id)}
                            disabled={issuePassMutation.isPending}
                            data-testid={`button-issue-${pass.id}`}
                          >
                            {issuePassMutation.isPending ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Issuing...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-id-card mr-2"></i>
                                Issue Pass
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full"
                            data-testid={`button-download-${pass.id}`}
                          >
                            <i className="fas fa-download mr-2"></i>
                            Download PDF
                          </Button>
                        </>
                      )}

                      {(pass.status === 'issued' || pass.status === 'active') && (
                        <>
                          <div className={`text-sm font-medium mb-3 ${
                            pass.status === 'issued' 
                              ? 'text-emerald-700' 
                              : 'text-green-700'
                          }`}>
                            <i className={`fas ${pass.status === 'issued' ? 'fa-check-circle' : 'fa-play-circle'} mr-2`}></i>
                            {pass.status === 'issued' ? 'Pass Issued' : 'Pass Active'}
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-sm mb-3">
                            <QRCodeSVG
                              value={pass.qrCode || ''}
                              size={128}
                              level="M"
                              includeMargin
                              data-testid={`qr-code-${pass.id}`}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mb-3" data-testid={`qr-pass-id-${pass.id}`}>
                            Pass ID: {pass.qrCode}
                          </p>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full mb-2"
                            data-testid={`button-view-details-${pass.id}`}
                          >
                            <i className="fas fa-eye mr-2"></i>
                            View Details
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full"
                            data-testid={`button-revoke-${pass.id}`}
                          >
                            <i className="fas fa-ban mr-2"></i>
                            Revoke Pass
                          </Button>
                        </>
                      )}
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
