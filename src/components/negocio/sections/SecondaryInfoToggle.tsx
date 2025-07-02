
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SecondaryInfoToggleProps {
  mostrarInfoSecundaria: boolean;
  onToggle: () => void;
  nombreContacto: string;
}

const SecondaryInfoToggle: React.FC<SecondaryInfoToggleProps> = ({
  mostrarInfoSecundaria,
  onToggle,
  nombreContacto
}) => {
  return (
    <div className="mt-6 pt-4 border-t border-slate-200">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full justify-between text-slate-600 hover:text-slate-700 hover:bg-slate-50"
      >
        <span className="text-sm font-medium">
          Información adicional ({nombreContacto}, evento, empresas)
        </span>
        {mostrarInfoSecundaria ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default SecondaryInfoToggle;
