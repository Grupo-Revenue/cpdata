import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import Navigation from '@/components/Navigation';
import { useNavigation } from '@/hooks/useNavigation';
import BusinessList from './business/BusinessList';
import BusinessCreate from './business/BusinessCreate';
import BusinessDetail from './business/BusinessDetail';
import ContactList from './contacts/ContactList';
import CompanyList from './companies/CompanyList';
import ProductLibrary from './products/ProductLibrary';
import DashboardOverview from './DashboardOverview';

const Dashboard = () => {
  const { vistaActual, negocioSeleccionado } = useNavigation();

  const renderCurrentView = () => {
    switch (vistaActual) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'crear-negocio':
        return <BusinessCreate />;
      case 'detalle-negocio':
        return <BusinessDetail negocioId={negocioSeleccionado!} />;
      case 'contactos':
        return <ContactList />;
      case 'empresas':
        return <CompanyList />;
      case 'productos':
        return <ProductLibrary />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navigation />
          <main className="flex-1 p-6">
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;