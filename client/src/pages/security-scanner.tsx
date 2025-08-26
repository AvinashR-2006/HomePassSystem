import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScanLog } from "@shared/schema";

interface ValidationResult {
  valid: boolean;
  message: string;
  studentName?: string;
  class?: string;
  validUntil?: string;
}

export default function SecurityScanner() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<{ passCode: string }>({
    defaultValues: {
      passCode: "",
    },
  });

  const { data: recentScans = [] } = useQuery<ScanLog[]>({
    queryKey: ["/api/scan-logs/recent/10"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: allScans = [] } = useQuery<ScanLog[]>({
    queryKey: ["/api/scan-logs"],
  });

  const validatePassMutation = useMutation({
    mutationFn: async (passCode: string) => {
      const response = await apiRequest("POST", "/api/passes/validate", { passCode });
      return response.json();
    },
    onSuccess: (result: ValidationResult) => {
      setValidationResult(result);
      if (result.valid) {
        toast({ title: "Valid Pass", description: "Student authorized to exit" });
      } else {
        toast({ title: "Invalid Pass", description: result.message, variant: "destructive" });
      }
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to validate pass" });
    },
  });

  const onSubmit = (data: { passCode: string }) => {
    validatePassMutation.mutate(data.passCode);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Security Scanner Portal</CardTitle>
          <p className="text-muted-foreground">Scan or enter pass codes to validate student exits</p>
        </CardHeader>
        <CardContent>
          {/* Scanner Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Scanner */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                <i className="fas fa-camera mr-2"></i>QR Code Scanner
              </h3>
              <div className="bg-muted/20 border-2 border-dashed border-border rounded-lg p-8 mb-4">
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-qrcode text-6xl text-gray-400 mb-4"></i>
                    <p className="text-sm text-muted-foreground">Position QR code within frame</p>
                  </div>
                </div>
              </div>
              <Button data-testid="button-start-camera">
                <i className="fas fa-video mr-2"></i>
                Start Camera
              </Button>
            </div>

            {/* Manual Entry */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                <i className="fas fa-keyboard mr-2"></i>Manual Entry
              </h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="passCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pass Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="HP-001234-QR"
                            {...field}
                            data-testid="input-pass-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={validatePassMutation.isPending}
                    data-testid="button-validate-pass"
                  >
                    {validatePassMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Validating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search mr-2"></i>
                        Validate Pass
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Recent Scans */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-foreground mb-3">Recent Validations</h4>
                {recentScans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent scans</p>
                ) : (
                  <div className="space-y-2">
                    {recentScans.map((scan) => (
                      <div 
                        key={scan.id} 
                        className="flex items-center justify-between p-3 bg-muted/20 rounded-md"
                        data-testid={`recent-scan-${scan.id}`}
                      >
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                            scan.result === 'valid' 
                              ? 'bg-emerald-100' 
                              : 'bg-red-100'
                          }`}>
                            <i className={`text-sm ${
                              scan.result === 'valid' 
                                ? 'fas fa-check text-emerald-600' 
                                : 'fas fa-times text-red-600'
                            }`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground" data-testid={`scan-student-${scan.id}`}>
                              {scan.studentName}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`scan-pass-id-${scan.id}`}>
                              {scan.passId}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground" data-testid={`scan-time-${scan.id}`}>
                          {new Date(scan.scannedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className="mt-8">
              <div className={`border rounded-lg p-6 ${
                validationResult.valid
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
              }`} data-testid="validation-result">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 ${
                      validationResult.valid
                        ? 'bg-emerald-100'
                        : 'bg-red-100'
                    }`}>
                      <i className={`text-xl ${
                        validationResult.valid
                          ? 'fas fa-check-circle text-emerald-600'
                          : 'fas fa-times-circle text-red-600'
                      }`}></i>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        validationResult.valid ? 'text-emerald-800' : 'text-red-800'
                      }`}>
                        {validationResult.valid ? '✅ Valid Pass' : '❌ Invalid Pass'}
                      </h3>
                      <p className={`text-sm ${
                        validationResult.valid ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {validationResult.message}
                      </p>
                    </div>
                  </div>
                </div>

                {validationResult.valid && validationResult.studentName && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/50 rounded-md p-4">
                    <div>
                      <span className="text-sm text-emerald-700 font-medium">Student:</span>
                      <p className="text-emerald-800" data-testid="result-student-name">
                        {validationResult.studentName}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-emerald-700 font-medium">Class:</span>
                      <p className="text-emerald-800" data-testid="result-class">
                        {validationResult.class}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-emerald-700 font-medium">Valid Until:</span>
                      <p className="text-emerald-800" data-testid="result-valid-until">
                        {validationResult.validUntil}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Log */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Security Log</CardTitle>
          <p className="text-muted-foreground">Complete log of all scan attempts and validations</p>
        </CardHeader>
        <CardContent>
          {allScans.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-clipboard-list text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No scan logs available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pass ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Officer</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {allScans.map((log) => (
                    <tr key={log.id} data-testid={`log-row-${log.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`log-time-${log.id}`}>
                        {new Date(log.scannedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`log-student-${log.id}`}>
                        {log.studentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground" data-testid={`log-pass-id-${log.id}`}>
                        {log.passId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.result === 'valid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`} data-testid={`log-result-${log.id}`}>
                          {log.result === 'valid' ? '✅ Valid' : '❌ Invalid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`log-officer-${log.id}`}>
                        {log.officer}
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
