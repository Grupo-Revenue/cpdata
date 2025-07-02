
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import DashboardNegocios from '@/components/DashboardNegocios';

interface BusinessSectionProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const BusinessSection: React.FC<BusinessSectionProps> = ({ onCrearNegocio, onVerNegocio }) => {
  return (
    <Card className="modern-card animate-fade-in-scale">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-primary" />
          <span>Mis Negocios</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DashboardNegocios
          onCrearNegocio={onCrearNegocio}
          onVerNegocio={onVerNegocio}
        />
      </CardContent>
    </Card>
  );
};

export default BusinessSection;
