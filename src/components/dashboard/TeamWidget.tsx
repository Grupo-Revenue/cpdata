
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const TeamWidget: React.FC = () => {
  return (
    <Card className="modern-card animate-fade-in-scale" style={{ animationDelay: '0.4s' }}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-500" />
          <span>Equipo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Miembros Activos</span>
            <Badge variant="secondary">8</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">En Línea Ahora</span>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <Badge variant="secondary">5</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Proyectos Asignados</span>
            <Badge variant="secondary">23</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamWidget;
