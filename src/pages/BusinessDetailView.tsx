
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DetalleNegocio from '@/components/DetalleNegocio';

interface BusinessDetailViewProps {
  negocioId: string;
  onVolver: () => void;
}

const BusinessDetailView: React.FC<BusinessDetailViewProps> = ({ negocioId, onVolver }) => {
  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <DetalleNegocio
          negocioId={negocioId}
          onVolver={onVolver}
        />
      </main>
    </DashboardLayout>
  );
};

export default BusinessDetailView;
