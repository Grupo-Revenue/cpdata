import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Info, Mail } from 'lucide-react';

interface AccessDeniedInfoProps {
  feature: string;
  description?: string;
  showContactAdmin?: boolean;
}

export const AccessDeniedInfo: React.FC<AccessDeniedInfoProps> = ({
  feature,
  description,
  showContactAdmin = true,
}) => {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Shield className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Función Restringida</AlertTitle>
      <AlertDescription className="text-amber-700 space-y-2">
        <p>
          <strong>{feature}</strong> está disponible solo para administradores.
          {description && (
            <>
              <br />
              {description}
            </>
          )}
        </p>
        {showContactAdmin && (
          <div className="flex items-start space-x-2 mt-3 p-3 bg-amber-100 rounded-lg">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">¿Necesitas acceso?</p>
              <p className="text-amber-700">
                Contacta con tu administrador para solicitar permisos adicionales.
              </p>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Mensajes predefinidos para diferentes funciones
export const ACCESS_DENIED_MESSAGES = {
  CREATE_PRODUCTS: {
    feature: 'Creación de Productos',
    description: 'La gestión de la biblioteca de productos requiere permisos de administrador para mantener la consistencia del catálogo.',
  },
  CREATE_USERS: {
    feature: 'Creación de Usuarios',
    description: 'La gestión de usuarios y roles es una función administrativa crítica.',
  },
  ADMIN_ACCESS: {
    feature: 'Panel de Administración',
    description: 'El acceso al panel de administración está restringido a usuarios con privilegios administrativos.',
  },
} as const;