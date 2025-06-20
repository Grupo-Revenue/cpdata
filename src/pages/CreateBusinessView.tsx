
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WizardCrearNegocio from '@/components/WizardCrearNegocio';

interface CreateBusinessViewProps {
  onComplete: (negocioId: string) => void;
  onCancel: () => void;
}

const CreateBusinessView: React.FC<CreateBusinessViewProps> = ({ onComplete, onCancel }) => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <WizardCrearNegocio
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateBusinessView;
