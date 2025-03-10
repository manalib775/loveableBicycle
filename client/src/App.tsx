import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { onCLS, onFID, onLCP } from "web-vitals";
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import PremiumBicycles from "@/pages/premium-bicycles";
import KidsBicycles from "@/pages/kids-bicycles";
import AdultBicycles from "@/pages/adult-bicycles";
import SellPage from "@/pages/sell-page";
import BicycleDetailPage from "@/pages/bicycle-detail-page";
import ProfilePage from "@/pages/profile-page";
import BlogsPage from "@/pages/blogs-page";
import AdminDashboard from "@/pages/admin-dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import { initGA, usePageTracking } from "./lib/analytics";

function Router() {
  usePageTracking();

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/premium" component={PremiumBicycles} />
      <Route path="/kids" component={KidsBicycles} />
      <Route path="/adult" component={AdultBicycles} />
      <Route path="/blogs" component={BlogsPage} />
      <Route path="/bicycles/:id" component={BicycleDetailPage} />
      <Route path="/sell" component={SellPage} />
      <Route path="/profile">
        {() => (
          <ProtectedRoute 
            path="/profile" 
            component={ProfilePage}
          />
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <ProtectedRoute
            path="/admin"
            component={AdminDashboard}
            requireAdmin={true}
          />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    if (import.meta.env.VITE_GA_TRACKING_ID) {
      initGA();
    }

    if ("web-vitals" in window) {
      onCLS(console.log);
      onFID(console.log);
      onLCP(console.log);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;