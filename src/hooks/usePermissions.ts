import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_PERMISSIONS, Permission, Role } from '@/constants/permissions';

export const usePermissions = () => {
  const { user, isAdmin, loading } = useAuth();

  const userRoles = useMemo((): Role[] => {
    if (!user || loading) return [];
    
    // Si es admin, tiene el rol admin
    if (isAdmin) return ['admin'];
    
    // Todos los demás usuarios tienen rol 'user'
    return ['user'];
  }, [user, isAdmin, loading]);

  const permissions = useMemo((): Permission[] => {
    if (!user || loading) return [];
    
    // Obtener todos los permisos para los roles del usuario
    const allPermissions = userRoles.flatMap(role => ROLE_PERMISSIONS[role] || []);
    
    // Eliminar duplicados
    return [...new Set(allPermissions)];
  }, [userRoles, user, loading]);

  const hasPermission = (permission: Permission): boolean => {
    if (loading) return false;
    if (!user) return false;
    
    // Los admins siempre tienen todos los permisos
    if (isAdmin) return true;
    
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (loading) return false;
    if (!user) return false;
    
    // Los admins siempre tienen todos los permisos
    if (isAdmin) return true;
    
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (loading) return false;
    if (!user) return false;
    
    // Los admins siempre tienen todos los permisos
    if (isAdmin) return true;
    
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  const isUserRole = (role: Role): boolean => {
    if (loading) return false;
    if (!user) return false;
    
    return userRoles.includes(role);
  };

  return {
    permissions,
    userRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isUserRole,
    isAdmin,
    loading,
    isAuthenticated: !!user && !loading,
  };
};