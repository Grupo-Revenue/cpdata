import { lazy } from 'react';

// Lazy load main pages for better performance
export const DashboardView = lazy(() => import('@/pages/DashboardView'));
export const CreateBusinessView = lazy(() => import('@/pages/CreateBusinessView'));
export const BusinessDetailView = lazy(() => import('@/pages/BusinessDetailView'));
export const Admin = lazy(() => import('@/pages/Admin'));
export const Settings = lazy(() => import('@/pages/Settings'));
export const PresupuestoPDFView = lazy(() => import('@/pages/PresupuestoPDFView'));