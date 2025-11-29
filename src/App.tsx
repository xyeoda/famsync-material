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
import InviteError from "./pages/InviteError";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBulkEvents from "./pages/AdminBulkEvents";
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
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invite/:token" element={<AcceptInvite />} />
            <Route path="/invite-error" element={<InviteError />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/bulk-events" element={<AdminBulkEvents />} />
            
            {/* Family-scoped routes with household context */}
            <Route
              path="/family/:householdId"
              element={(
                <HouseholdProvider>
                  <FamilySettingsProvider>
                    <FamilyLayout />
                  </FamilySettingsProvider>
                </HouseholdProvider>
              )}
            >
              <Route index element={<FamilyDashboard />} />
              <Route path="calendar" element={<FamilyCalendar />} />
              <Route path="settings" element={<FamilySettings />} />
              <Route path="bulk-events" element={<AdminBulkEvents />} />
            </Route>
            
            {/* Display mode (read-only) still needs household context for name, but editing stays disabled */}
            <Route
              path="/display/:householdId"
              element={(
                <HouseholdProvider>
                  <FamilyCalendar />
                </HouseholdProvider>
              )}
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
