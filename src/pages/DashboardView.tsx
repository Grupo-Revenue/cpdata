
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompactDashboardHeader from '@/components/dashboard/CompactDashboardHeader';
import BusinessesTable from '@/components/dashboard/BusinessesTable';

interface DashboardViewProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCrearNegocio, onVerNegocio }) => {
  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <CompactDashboardHeader onCrearNegocio={onCrearNegocio} />
        </div>

        {/* Businesses Table - Main content */}
        <div>
          <BusinessesTable 
            onCrearNegocio={onCrearNegocio}
            onVerNegocio={onVerNegocio}
          />
        </div>
      </main>
    </DashboardLayout>
  );
};

export default DashboardView;
