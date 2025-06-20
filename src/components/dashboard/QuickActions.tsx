
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, BarChart3 } from 'lucide-react';

interface QuickActionProps {
  onCrearNegocio: () => void;
}

const QuickActions: React.FC<QuickActionProps> = ({ onCrearNegocio }) => {
  const actions = [
    {
      title: "Nuevo Negocio",
      description: "Crear un nuevo negocio",
      icon: Plus,
      action: onCrearNegocio,
      color: "from-blue-500 to-cyan-500",
      featured: true
    },
    {
      title: "Nuevo Presupuesto",
      description: "Generar presupuesto",
      icon: FileText,
      action: () => console.log("Crear presupuesto"),
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Ver Reportes",
      description: "Analíticas y métricas",
      icon: BarChart3,
      action: () => console.log("Ver analíticas"),
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <span>Acciones Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            
            if (action.featured) {
              return (
                <Button
                  key={action.title}
                  onClick={action.action}
                  className={`w-full h-auto p-4 bg-gradient-to-r ${action.color} hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 group`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Icon className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start text-left">
                      <span className="font-semibold text-white">{action.title}</span>
                      <span className="text-xs text-white/80">{action.description}</span>
                    </div>
                  </div>
                </Button>
              );
            }

            return (
              <Button
                key={action.title}
                variant="ghost"
                onClick={action.action}
                className="w-full h-auto p-3 justify-start hover:bg-accent/10 group animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-sm group-hover:shadow-md transition-all duration-200`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{action.title}</span>
                    <span className="text-xs text-muted-foreground">{action.description}</span>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
