
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompactDashboardHeader from '@/components/dashboard/CompactDashboardHeader';
import BusinessesTable from '@/components/dashboard/BusinessesTable';
import RealTimeStateValidator from '@/components/business/RealTimeStateValidator';

interface DashboardViewProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCrearNegocio, onVerNegocio }) => {
  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Real-time State Validator - Shows alerts for inconsistencies */}
        <RealTimeStateValidator />
        
        {/* Header */}
        <div className="mb-8">
          <CompactDashboardHeader onCrearNegocio={onCrearNegocio} />
        </div>

        {/* Main Content - Direct Business Table Display */}
        <BusinessesTable 
          onCrearNegocio={onCrearNegocio}
          onVerNegocio={onVerNegocio}
        />
      </main>
    </DashboardLayout>
  );
};

export default DashboardView;
