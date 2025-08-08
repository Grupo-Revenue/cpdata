
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
import { InitializeLogo } from "./pages/InitializeLogo";
import { queryClient } from "@/utils/queryClient";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={
                  <LoadingOverlay message="Cargando aplicación..." />
                }>
                <Routes>
                  {/* Public routes - no authentication required - MUST BE FIRST */}
                  <Route path="/public/presupuesto/:presupuestoName/:negocioId/:presupuestoId/view" element={<PublicPresupuestoPrintView />} />
                  <Route path="/presupuesto/:negocioId/:presupuestoId/view" element={<PublicPresupuestoPrintView />} />
                  
                  {/* Auth route */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes - require authentication */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <NegocioProvider>
                        <HubSpotSyncProvider>
                          <Index />
                        </HubSpotSyncProvider>
                      </NegocioProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <NegocioProvider>
                        <HubSpotSyncProvider>
                          <Settings />
                        </HubSpotSyncProvider>
                      </NegocioProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <NegocioProvider>
                        <HubSpotSyncProvider>
                          <Admin />
                        </HubSpotSyncProvider>
                      </NegocioProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/negocio/:negocioId" element={
                    <ProtectedRoute>
                      <NegocioProvider>
                        <HubSpotSyncProvider>
                          <Index />
                        </HubSpotSyncProvider>
                      </NegocioProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/presupuesto/:negocioId/:presupuestoId/pdf" element={
                    <ProtectedRoute>
                      <NegocioProvider>
                        <HubSpotSyncProvider>
                          <PresupuestoPDFView />
                        </HubSpotSyncProvider>
                      </NegocioProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/initialize-logo" element={
                    <ProtectedRoute>
                      <InitializeLogo />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
