import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/constants/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AccessDeniedInfo } from '@/components/AccessDeniedInfo';

interface ProtectedFeatureProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAllPermissions?: boolean;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  showInlineInfo?: boolean;
  infoMessage?: {
    feature: string;
    description?: string;
  };
  children: React.ReactNode;
}

const AccessDeniedMessage: React.FC<{ onGoBack?: () => void }> = ({ onGoBack }) => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground mb-6">
            No tienes permisos suficientes para acceder a esta funcionalidad.
          </p>
        </div>
        
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Esta función está restringida a usuarios con permisos de administrador.
            Si necesitas acceso, contacta con tu administrador.
          </AlertDescription>
        </Alert>
        
        <Button onClick={handleGoBack} className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};

export const ProtectedFeature: React.FC<ProtectedFeatureProps> = ({
  permission,
  permissions = [],
  requireAllPermissions = false,
  fallback,
  showAccessDenied = true,
  showInlineInfo = false,
  infoMessage,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, isAuthenticated } = usePermissions();

  // Mientras carga, no mostrar nada o mostrar loading
  if (loading) {
    return null;
  }

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated) {
    return null;
  }

  // Construir lista de permisos requeridos
  const requiredPermissions = [...permissions];
  if (permission) {
    requiredPermissions.push(permission);
  }

  // Si no hay permisos requeridos, mostrar el contenido
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Verificar permisos
  const hasAccess = requireAllPermissions 
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    
    if (showInlineInfo && infoMessage) {
      return (
        <AccessDeniedInfo 
          feature={infoMessage.feature}
          description={infoMessage.description}
        />
      );
    }
    
    if (showAccessDenied) {
      return <AccessDeniedMessage />;
    }
    
    return null;
  }

  return <>{children}</>;
};

// Hook para componentes que necesiten verificar permisos sin renderizar
export const useFeatureAccess = (
  permission?: Permission,
  permissions: Permission[] = [],
  requireAllPermissions = false
) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, isAuthenticated } = usePermissions();

  const requiredPermissions = [...permissions];
  if (permission) {
    requiredPermissions.push(permission);
  }

  if (loading || !isAuthenticated || requiredPermissions.length === 0) {
    return { hasAccess: false, loading, isAuthenticated };
  }

  const hasAccess = requireAllPermissions 
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  return { hasAccess, loading, isAuthenticated };
};