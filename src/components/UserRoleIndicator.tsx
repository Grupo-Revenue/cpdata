import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface UserRoleIndicatorProps {
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'outline';
}

export const UserRoleIndicator: React.FC<UserRoleIndicatorProps> = ({
  className = '',
  showIcon = true,
  variant = 'default',
}) => {
  const { isAdmin, loading } = usePermissions();

  if (loading) {
    return (
      <Badge variant="outline" className={`animate-pulse ${className}`}>
        Cargando...
      </Badge>
    );
  }

  if (isAdmin) {
    return (
      <Badge 
        variant={variant} 
        className={`bg-red-100 text-red-800 border-red-200 hover:bg-red-200 ${className}`}
      >
        {showIcon && <Shield className="w-3 h-3 mr-1" />}
        Administrador
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-blue-50 text-blue-700 border-blue-200 ${className}`}
    >
      {showIcon && <User className="w-3 h-3 mr-1" />}
      Usuario
    </Badge>
  );
};

export default UserRoleIndicator;