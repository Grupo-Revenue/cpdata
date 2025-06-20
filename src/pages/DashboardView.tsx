
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompactDashboardHeader from '@/components/dashboard/CompactDashboardHeader';
import MetricsWidget from '@/components/dashboard/MetricsWidget';
import BusinessesTable from '@/components/dashboard/BusinessesTable';
import QuickActionsToolbar from '@/components/dashboard/QuickActionsToolbar';

interface DashboardViewProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCrearNegocio, onVerNegocio }) => {
  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with quick actions toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0 mb-8">
          <div className="flex-1">
            <CompactDashboardHeader onCrearNegocio={onCrearNegocio} />
          </div>
          <div className="lg:ml-6">
            <QuickActionsToolbar />
          </div>
        </div>

        {/* Metrics Widget */}
        <div className="mb-8">
          <MetricsWidget />
        </div>

        {/* Businesses Table */}
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
