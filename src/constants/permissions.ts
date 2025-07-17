// Constantes de permisos del sistema
export const PERMISSIONS = {
  // Administración de productos
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  
  // Administración de usuarios
  CREATE_USERS: 'create_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_ALL_USERS: 'view_all_users',
  
  // Acceso a administración
  ACCESS_ADMIN: 'access_admin',
  
  // Gestión comercial (permitido para todos los usuarios)
  CREATE_BUSINESS: 'create_business',
  EDIT_BUSINESS: 'edit_business',
  DELETE_BUSINESS: 'delete_business',
  CREATE_CONTACTS: 'create_contacts',
  CREATE_COMPANIES: 'create_companies',
  CREATE_BUDGETS: 'create_budgets',
  EDIT_BUDGETS: 'edit_budgets',
  VIEW_BUDGET_PREVIEW: 'view_budget_preview',
  SHARE_BUDGETS: 'share_budgets',
  REGENERATE_LINKS: 'regenerate_links',
} as const;

// Permisos para cada rol
export const ROLE_PERMISSIONS = {
  admin: [
    // Admins tienen TODOS los permisos sin restricciones
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.ACCESS_ADMIN,
    PERMISSIONS.CREATE_BUSINESS,
    PERMISSIONS.EDIT_BUSINESS,
    PERMISSIONS.DELETE_BUSINESS,
    PERMISSIONS.CREATE_CONTACTS,
    PERMISSIONS.CREATE_COMPANIES,
    PERMISSIONS.CREATE_BUDGETS,
    PERMISSIONS.EDIT_BUDGETS,
    PERMISSIONS.VIEW_BUDGET_PREVIEW,
    PERMISSIONS.SHARE_BUDGETS,
    PERMISSIONS.REGENERATE_LINKS,
  ],
  user: [
    // Usuarios normales pueden hacer TODO excepto gestión de productos y usuarios
    PERMISSIONS.CREATE_BUSINESS,
    PERMISSIONS.EDIT_BUSINESS,
    PERMISSIONS.DELETE_BUSINESS,
    PERMISSIONS.CREATE_CONTACTS,
    PERMISSIONS.CREATE_COMPANIES,
    PERMISSIONS.CREATE_BUDGETS,
    PERMISSIONS.EDIT_BUDGETS,
    PERMISSIONS.VIEW_BUDGET_PREVIEW,
    PERMISSIONS.SHARE_BUDGETS,
    PERMISSIONS.REGENERATE_LINKS,
    // NO incluye: CREATE_PRODUCTS, EDIT_PRODUCTS, DELETE_PRODUCTS, CREATE_USERS, MANAGE_ROLES, ACCESS_ADMIN
  ],
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type Role = keyof typeof ROLE_PERMISSIONS;