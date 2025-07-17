import { PERMISSIONS, Permission } from '@/constants/permissions';

/**
 * Utility functions for working with permissions
 */

// Helper to check if a user can access admin features
export const canAccessAdmin = (permissions: Permission[]): boolean => {
  return permissions.includes(PERMISSIONS.ACCESS_ADMIN);
};

// Helper to check if a user can manage products
export const canManageProducts = (permissions: Permission[]): boolean => {
  const productPermissions: Permission[] = [
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS
  ];
  return permissions.some(p => productPermissions.includes(p));
};

// Helper to check if a user can manage users
export const canManageUsers = (permissions: Permission[]): boolean => {
  const userPermissions: Permission[] = [
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ALL_USERS
  ];
  return permissions.some(p => userPermissions.includes(p));
};

// Helper to check if a user can manage commercial features
export const canManageCommercial = (permissions: Permission[]): boolean => {
  const commercialPermissions: Permission[] = [
    PERMISSIONS.CREATE_BUSINESS,
    PERMISSIONS.EDIT_BUSINESS,
    PERMISSIONS.CREATE_CONTACTS,
    PERMISSIONS.CREATE_COMPANIES,
    PERMISSIONS.CREATE_BUDGETS,
    PERMISSIONS.EDIT_BUDGETS
  ];
  return permissions.some(p => commercialPermissions.includes(p));
};

// Helper to get restricted features for a user
export const getRestrictedFeatures = (permissions: Permission[]): string[] => {
  const restricted: string[] = [];
  
  if (!canManageProducts(permissions)) {
    restricted.push('Gestión de Productos');
  }
  
  if (!canManageUsers(permissions)) {
    restricted.push('Gestión de Usuarios');
  }
  
  if (!canAccessAdmin(permissions)) {
    restricted.push('Panel de Administración');
  }
  
  return restricted;
};

// Helper to get available features for a user
export const getAvailableFeatures = (permissions: Permission[]): string[] => {
  const available: string[] = [];
  
  if (canManageCommercial(permissions)) {
    available.push('Gestión de Negocios', 'Gestión de Presupuestos', 'Contactos y Empresas');
  }
  
  if (canManageProducts(permissions)) {
    available.push('Gestión de Productos');
  }
  
  if (canManageUsers(permissions)) {
    available.push('Gestión de Usuarios');
  }
  
  if (canAccessAdmin(permissions)) {
    available.push('Panel de Administración');
  }
  
  return available;
};