
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, Settings, Users, FileText } from 'lucide-react';

const QuickActionsToolbar: React.FC = () => {
  const actions = [
    {
      icon: BarChart3,
      label: 'Reportes',
      action: () => console.log('Ver reportes')
    },
    {
      icon: Users,
      label: 'Contactos',
      action: () => console.log('Ver contactos')
    },
    {
      icon: FileText,
      label: 'Plantillas',
      action: () => console.log('Ver plantillas')
    },
    {
      icon: Settings,
      label: 'Configuración',
      action: () => window.location.href = '/settings'
    }
  ];

  return (
    <div className="flex space-x-2">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            onClick={action.action}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            title={action.label}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden md:inline">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default QuickActionsToolbar;
