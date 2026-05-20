import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ExamGenerator from "@/pages/exam-generator";
import AssignmentBuilder from "@/pages/assignment-builder";
import Editor from "@/pages/editor";
import Saved from "@/pages/saved";
import Settings from "@/pages/settings";
import AppLayout from "@/components/layout/app-layout";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/exam-generator">
        <AppLayout><ExamGenerator /></AppLayout>
      </Route>
      <Route path="/assignment-builder">
        <AppLayout><AssignmentBuilder /></AppLayout>
      </Route>
      <Route path="/editor/:id">
        <AppLayout><Editor /></AppLayout>
      </Route>
      <Route path="/saved">
        <AppLayout><Saved /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><Settings /></AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
