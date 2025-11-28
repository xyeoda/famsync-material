import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HouseholdProvider } from "./contexts/HouseholdContext";
import { FamilySettingsProvider } from "./contexts/FamilySettingsContext";
import { FamilyLayout } from "./components/FamilyLayout";
import LandingPage from "./pages/LandingPage";
import FamilyDashboard from "./pages/FamilyDashboard";
import FamilyCalendar from "./pages/FamilyCalendar";
import FamilySettings from "./pages/FamilySettings";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Setup from "./pages/Setup";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { initializeSampleData } from "./lib/initSampleData";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeSampleData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <HouseholdProvider>
            <FamilySettingsProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/accept-invite/:token" element={<AcceptInvite />} />
                <Route path="/admin" element={<AdminDashboard />} />
                
                {/* Family-scoped routes */}
                <Route path="/family/:householdId" element={<FamilyLayout />}>
                  <Route index element={<FamilyDashboard />} />
                  <Route path="calendar" element={<FamilyCalendar />} />
                  <Route path="settings" element={<FamilySettings />} />
                </Route>
                
                {/* Display mode (read-only) */}
                <Route path="/display/:householdId" element={<FamilyCalendar />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </FamilySettingsProvider>
          </HouseholdProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
