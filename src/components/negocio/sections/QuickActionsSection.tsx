
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface QuickActionsSectionProps {
  onCrearPresupuesto: () => void;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ onCrearPresupuesto }) => {
  return (
    <Button 
      onClick={onCrearPresupuesto} 
      className="bg-slate-900 text-white hover:bg-slate-800"
    >
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Presupuesto
    </Button>
  );
};

export default QuickActionsSection;
