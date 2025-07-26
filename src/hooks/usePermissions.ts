
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_PERMISSIONS, Permission, Role } from '@/constants/permissions';

export const usePermissions = () => {
  const { user, isAdmin, loading } = useAuth();
  
  // Consider permissions still loading if auth is loading or if we have a user but haven't determined admin status yet
  const permissionsLoading = loading || (!!user && isAdmin === false && loading);

  const userRoles = useMemo((): Role[] => {
    if (!user || loading) return [];
    
    // Si es admin, tiene el rol admin
    if (isAdmin) return ['admin'];
    
    // Todos los demás usuarios tienen rol 'user' por defecto
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
    if (permissionsLoading) return false;
    if (!user) return false;
    
    // Los admins siempre tienen todos los permisos
    if (isAdmin) return true;
    
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    if (permissionsLoading) return false;
    if (!user) return false;
    
    // Los admins siempre tienen todos los permisos
    if (isAdmin) return true;
    
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    if (permissionsLoading) return false;
    if (!user) return false;
    
    // Los admins siempre tienen todos los permisos
    if (isAdmin) return true;
    
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  const isUserRole = (role: Role): boolean => {
    if (permissionsLoading) return false;
    if (!user) return false;
    
    return userRoles.includes(role);
  };

  const canManageUsers = (): boolean => {
    return hasPermission('manage_roles') || hasPermission('create_users') || hasPermission('view_all_users');
  };

  const canAccessAdmin = (): boolean => {
    return hasPermission('access_admin');
  };

  return {
    permissions,
    userRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isUserRole,
    canManageUsers,
    canAccessAdmin,
    isAdmin,
    loading: permissionsLoading,
    isAuthenticated: !!user && !permissionsLoading,
  };
};
