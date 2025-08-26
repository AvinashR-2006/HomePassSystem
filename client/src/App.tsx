import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import Dashboard from "@/pages/dashboard";
import StudentForm from "@/pages/student-form";
import ParentApproval from "@/pages/parent-approval";
import WardenPanel from "@/pages/warden-panel";
import SecurityScanner from "@/pages/security-scanner";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/student-form" component={StudentForm} />
        <Route path="/parent-approval" component={ParentApproval} />
        <Route path="/warden-panel" component={WardenPanel} />
        <Route path="/security-scanner" component={SecurityScanner} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
