
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
      <div className="h-full w-full">
        <DetalleNegocio
          negocioId={negocioId}
          onVolver={onVolver}
        />
      </div>
    </DashboardLayout>
  );
};

export default BusinessDetailView;
