
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ChevronRight } from 'lucide-react';
import DashboardNegocios from '@/components/DashboardNegocios';

interface BusinessSectionProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const BusinessSection: React.FC<BusinessSectionProps> = ({ onCrearNegocio, onVerNegocio }) => {
  return (
    <Card className="modern-card animate-fade-in-scale">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <span>Mis Negocios</span>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onCrearNegocio}
          className="hover-glow"
        >
          Ver todos
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
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
