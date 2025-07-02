
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

const ActivityFeed: React.FC = () => {
  const activities = [
    {
      action: "Nuevo presupuesto creado",
      business: "Construcciones ABC",
      time: "Hace 2 horas",
      status: "success"
    },
    {
      action: "Cliente agregado",
      business: "Servicios XYZ",
      time: "Hace 4 horas",
      status: "info"
    },
    {
      action: "Producto actualizado",
      business: "Construcciones ABC",
      time: "Ayer",
      status: "neutral"
    }
  ];

  return (
    <Card className="modern-card animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-accent" />
          <span>Actividad Reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
              <div className="space-y-1">
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.business}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={item.status === 'success' ? 'default' : 'secondary'} className="text-xs">
                  {item.time}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
