
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingOverlay message="Cargando...">
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button asChild variant="outline" aria-label="Ir al login">
            <Link to="/auth">Ir al login</Link>
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </LoadingOverlay>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
