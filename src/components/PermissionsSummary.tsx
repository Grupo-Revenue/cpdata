import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { getAvailableFeatures, getRestrictedFeatures } from '@/utils/permissionHelpers';
import { Shield, Check, X, Info } from 'lucide-react';
import { UserRoleIndicator } from '@/components/UserRoleIndicator';

interface PermissionsSummaryProps {
  className?: string;
}

export const PermissionsSummary: React.FC<PermissionsSummaryProps> = ({ className = '' }) => {
  const { permissions, isAdmin, loading, isAuthenticated } = usePermissions();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const availableFeatures = getAvailableFeatures(permissions);
  const restrictedFeatures = getRestrictedFeatures(permissions);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Permisos y Accesos</span>
          </div>
          <UserRoleIndicator variant="outline" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Acceso Completo de Administrador
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Tienes acceso total a todas las funcionalidades del sistema sin restricciones.
            </p>
          </div>
        )}

        {/* Funciones Disponibles */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Check className="h-4 w-4 text-green-600 mr-1" />
            Funciones Disponibles
          </h4>
          <div className="space-y-1">
            {availableFeatures.map((feature) => (
              <Badge key={feature} variant="outline" className="mr-2 mb-1 bg-green-50 text-green-700 border-green-200">
                {feature}
              </Badge>
            ))}
            {availableFeatures.length === 0 && (
              <p className="text-xs text-gray-500">No hay funciones específicas asignadas</p>
            )}
          </div>
        </div>

        {/* Funciones Restringidas (solo si hay alguna) */}
        {restrictedFeatures.length > 0 && !isAdmin && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <X className="h-4 w-4 text-red-600 mr-1" />
              Funciones Restringidas
            </h4>
            <div className="space-y-1">
              {restrictedFeatures.map((feature) => (
                <Badge key={feature} variant="outline" className="mr-2 mb-1 bg-red-50 text-red-700 border-red-200">
                  {feature}
                </Badge>
              ))}
            </div>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <Info className="h-3 w-3 inline mr-1" />
              Contacta con tu administrador si necesitas acceso a estas funciones.
            </div>
          </div>
        )}

        {/* Información para desarrolladores (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug Info (Development)</summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
              <div>Permisos: {permissions.length}</div>
              <div>Es Admin: {isAdmin ? 'Sí' : 'No'}</div>
              <div>Total Disponibles: {availableFeatures.length}</div>
              <div>Total Restringidas: {restrictedFeatures.length}</div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionsSummary;