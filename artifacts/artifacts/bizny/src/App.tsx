import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Home from "@/pages/Home";
import HomeV2 from "@/pages/HomeV2";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Opportunities from "@/pages/Opportunities";
import Marketplace from "@/pages/Marketplace";
import Templates from "@/pages/Templates";
import VentureDetail from "@/pages/VentureDetail";
import Ventures from "@/pages/Ventures";
import VentureCreate from "@/pages/VentureCreate";
import Updates from "@/pages/Updates";
import Copilot from "@/pages/Copilot";
import Clinic from "@/pages/Clinic";
import Coach from "@/pages/Coach";
import Profile from "@/pages/Profile";
import Repository from "@/pages/Repository";
import Directory from "@/pages/Directory";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Explore from "@/pages/Explore";
import IndustryTargets from "@/pages/IndustryTargets";
import DealDesk from "@/pages/DealDesk";
import DealDeskNew from "@/pages/DealDeskNew";
import DealDeskDetail from "@/pages/DealDeskDetail";
import Innovation from "@/pages/Innovation";
import Market from "@/pages/Market";
import TemplateDetail from "@/pages/TemplateDetail";
import Executions from "@/pages/Executions";
import KnowledgeBase from "@/pages/KnowledgeBase";
import KnowledgeArticleDetail from "@/pages/KnowledgeArticleDetail";
import About from "@/pages/About";
import FounderMessage from "@/pages/FounderMessage";
import ResearchPortal from "@/pages/ResearchPortal";
import ResearchAdmin from "@/pages/ResearchAdmin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRoute({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/research" component={ResearchPortal} />
      <Route path="/founding-research" component={ResearchPortal} />
      <Route path="/admin/research" component={ResearchAdmin} />
      <Route path="/v2" component={HomeV2} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/dashboard">
        <AppRoute><Dashboard /></AppRoute>
      </Route>
      <Route path="/explore">
        <AppRoute><Explore /></AppRoute>
      </Route>
      <Route path="/repository">
        <AppRoute><Repository /></AppRoute>
      </Route>
      <Route path="/directory">
        <AppRoute><Directory /></AppRoute>
      </Route>
      <Route path="/projects/:id">
        <AppRoute><ProjectDetail /></AppRoute>
      </Route>
      <Route path="/projects">
        <AppRoute><Projects /></AppRoute>
      </Route>
      <Route path="/opportunities">
        <AppRoute><Opportunities /></AppRoute>
      </Route>
      <Route path="/marketplace">
        <AppRoute><Marketplace /></AppRoute>
      </Route>
      <Route path="/templates/:id">
        <AppRoute><TemplateDetail /></AppRoute>
      </Route>
      <Route path="/templates">
        <AppRoute><Templates /></AppRoute>
      </Route>
      <Route path="/executions">
        <AppRoute><Executions /></AppRoute>
      </Route>
      <Route path="/knowledge/:slug">
        <AppRoute><KnowledgeArticleDetail /></AppRoute>
      </Route>
      <Route path="/knowledge">
        <AppRoute><KnowledgeBase /></AppRoute>
      </Route>
      <Route path="/ventures/new">
        <AppRoute><VentureCreate /></AppRoute>
      </Route>
      <Route path="/ventures/:id">
        <AppRoute><VentureDetail /></AppRoute>
      </Route>
      <Route path="/ventures">
        <AppRoute><Ventures /></AppRoute>
      </Route>
      <Route path="/deal-desk/new">
        <AppRoute><DealDeskNew /></AppRoute>
      </Route>
      <Route path="/deal-desk/:id">
        <AppRoute><DealDeskDetail /></AppRoute>
      </Route>
      <Route path="/deal-desk">
        <AppRoute><DealDesk /></AppRoute>
      </Route>
      <Route path="/updates">
        <AppRoute><Updates /></AppRoute>
      </Route>
      <Route path="/copilot">
        <AppRoute><Copilot /></AppRoute>
      </Route>
      <Route path="/clinic">
        <AppRoute><Clinic /></AppRoute>
      </Route>
      <Route path="/coach">
        <AppRoute><Coach /></AppRoute>
      </Route>
      <Route path="/profile">
        <AppRoute><Profile /></AppRoute>
      </Route>
      <Route path="/industry-targets">
        <AppRoute><IndustryTargets /></AppRoute>
      </Route>
      <Route path="/innovation">
        <AppRoute><Innovation /></AppRoute>
      </Route>
      <Route path="/market">
        <AppRoute><Market /></AppRoute>
      </Route>

      <Route path="/about" component={About} />
      <Route path="/founder-message" component={FounderMessage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
