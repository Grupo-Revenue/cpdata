
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CompactDashboardHeaderProps {
  onCrearNegocio: () => void;
}

const CompactDashboardHeader: React.FC<CompactDashboardHeaderProps> = ({ onCrearNegocio }) => {
  const { user } = useAuth();
  
  const getUserName = () => {
    if (user?.user_metadata?.nombre) {
      return user.user_metadata.nombre;
    }
    return user?.email?.split('@')[0] || 'Usuario';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {getUserName()}
        </h1>
        <p className="text-gray-600">
          Gestiona tus negocios y presupuestos
        </p>
      </div>
      
      <div>
        <Button 
          onClick={onCrearNegocio}
          className="bg-primary hover:bg-primary/90 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Negocio</span>
        </Button>
      </div>
    </div>
  );
};

export default CompactDashboardHeader;
