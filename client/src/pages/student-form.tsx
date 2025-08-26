import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertPassSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { parseExcelFile } from "@/lib/excel-parser";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { z } from "zod";

const formSchema = insertPassSchema.extend({
  departureDate: insertPassSchema.shape.departureDate,
  returnDate: insertPassSchema.shape.returnDate,
});

type FormData = z.infer<typeof formSchema>;

export default function StudentForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "",
      class: "",
      digitalId: "",
      parentEmail: "",
      reason: "",
      departureDate: "",
      returnDate: "",
    },
  });

  const createPassMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/passes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pass application submitted successfully!" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit pass application." });
    },
  });

  const uploadExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/students/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: `Successfully uploaded ${data.students.length} students to database` 
      });
      setSelectedFile(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload Excel file." });
    },
  });

  const handleDigitalIdChange = async (digitalId: string) => {
    if (!digitalId) return;

    try {
      const response = await fetch(`/api/students/digital/${digitalId}`);
      if (response.ok) {
        const student = await response.json();
        form.setValue("parentEmail", student.parentEmail);
        form.setValue("studentName", student.name);
        form.setValue("class", student.class);
      } else {
        form.setValue("parentEmail", "");
      }
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    uploadExcelMutation.mutate(selectedFile);
  };

  const onSubmit = (data: FormData) => {
    createPassMutation.mutate(data);
  };

  const classes = [
    "9-A", "9-B", "9-C",
    "10-A", "10-B", "10-C",
    "11-A", "11-B", "11-C",
    "12-A", "12-B", "12-C"
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Student Home Pass Application</CardTitle>
          <p className="text-muted-foreground">Submit your request for a digital home pass</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="digitalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <i className="fas fa-id-card mr-2"></i>Digital Student ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ST001234"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleDigitalIdChange(e.target.value);
                          }}
                          data-testid="input-digital-id"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Enter your student ID to auto-populate parent contact</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <i className="fas fa-user mr-2"></i>Full Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} data-testid="input-student-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <i className="fas fa-graduation-cap mr-2"></i>Class/Grade
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-class">
                            <SelectValue placeholder="Select your class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <i className="fas fa-envelope mr-2"></i>Parent Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="parent@email.com"
                          {...field}
                          readOnly
                          className="bg-muted/50"
                          data-testid="input-parent-email"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Auto-populated from student database</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <i className="fas fa-comment-dots mr-2"></i>Reason for Home Pass
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a detailed reason for your home pass request..."
                        {...field}
                        rows={4}
                        data-testid="textarea-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <i className="fas fa-calendar mr-2"></i>Departure Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-departure-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <i className="fas fa-calendar-check mr-2"></i>Expected Return Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-return-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <i className="fas fa-info-circle mr-2"></i>
                  Your request will be sent to your parent for approval
                </div>
                <Button 
                  type="submit" 
                  disabled={createPassMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {createPassMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Excel Upload Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Student Database Management</CardTitle>
          <p className="text-muted-foreground">Upload Excel file to update student-parent email mapping</p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <i className="fas fa-file-excel text-4xl text-emerald-500 mb-4"></i>
            <h4 className="text-lg font-medium text-foreground mb-2">Upload Student Database</h4>
            <p className="text-muted-foreground mb-4">Drag and drop your Excel file here, or click to browse</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="excelUpload"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              data-testid="input-excel-upload"
            />
            <div className="space-y-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById("excelUpload")?.click()}
                data-testid="button-choose-file"
              >
                <i className="fas fa-upload mr-2"></i>
                Choose File
              </Button>
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                  <Button
                    type="button"
                    className="ml-4"
                    onClick={handleFileUpload}
                    disabled={uploadExcelMutation.isPending}
                    data-testid="button-upload-file"
                  >
                    {uploadExcelMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt mr-2"></i>
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Expected format: Digital ID, Student Name, Class, Parent Email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
