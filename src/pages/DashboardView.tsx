
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import BusinessSection from '@/components/dashboard/BusinessSection';
import QuickActions from '@/components/dashboard/QuickActions';

interface DashboardViewProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCrearNegocio, onVerNegocio }) => {
  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader onCrearNegocio={onCrearNegocio} />
        <StatsCards />
        
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <BusinessSection 
              onCrearNegocio={onCrearNegocio}
              onVerNegocio={onVerNegocio}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
              <QuickActions onCrearNegocio={onCrearNegocio} />
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default DashboardView;
