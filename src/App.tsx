
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { NegocioProvider } from "@/context/NegocioContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import HubSpotSyncProvider from "@/components/HubSpotSyncProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import PresupuestoPDFView from "./pages/PresupuestoPDFView";

import PublicPresupuestoPrintView from "./pages/PublicPresupuestoPrintView";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/utils/queryClient";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes>
                {/* Public route - no authentication required - MUST BE FIRST */}
                <Route path="/public/presupuesto/:presupuestoName/:negocioId/:presupuestoId/view" element={<PublicPresupuestoPrintView />} />
                
                {/* Auth route */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes - require authentication */}
                <Route path="/" element={
                  <AuthProvider>
                    <NegocioProvider>
                      <HubSpotSyncProvider>
                        <ProtectedRoute>
                          <Index />
                        </ProtectedRoute>
                      </HubSpotSyncProvider>
                    </NegocioProvider>
                  </AuthProvider>
                } />
                <Route path="/settings" element={
                  <AuthProvider>
                    <NegocioProvider>
                      <HubSpotSyncProvider>
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      </HubSpotSyncProvider>
                    </NegocioProvider>
                  </AuthProvider>
                } />
                <Route path="/admin" element={
                  <AuthProvider>
                    <NegocioProvider>
                      <HubSpotSyncProvider>
                        <ProtectedRoute>
                          <Admin />
                        </ProtectedRoute>
                      </HubSpotSyncProvider>
                    </NegocioProvider>
                  </AuthProvider>
                } />
                <Route path="/negocio/:negocioId" element={
                  <AuthProvider>
                    <NegocioProvider>
                      <HubSpotSyncProvider>
                        <ProtectedRoute>
                          <Index />
                        </ProtectedRoute>
                      </HubSpotSyncProvider>
                    </NegocioProvider>
                  </AuthProvider>
                } />
                <Route path="/presupuesto/:negocioId/:presupuestoId/pdf" element={
                  <AuthProvider>
                    <NegocioProvider>
                      <HubSpotSyncProvider>
                        <ProtectedRoute>
                          <PresupuestoPDFView />
                        </ProtectedRoute>
                      </HubSpotSyncProvider>
                    </NegocioProvider>
                  </AuthProvider>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
