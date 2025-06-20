
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Bell } from 'lucide-react';

const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
      <div className="space-y-2 animate-fade-in-up">
        <h1 className="text-3xl font-bold tracking-tight">
          Panel de Control
        </h1>
        <p className="text-muted-foreground">
          Gestiona todos tus negocios desde un solo lugar
        </p>
      </div>
      
      <div className="flex items-center space-x-3 animate-slide-in-right">
        <Button variant="outline" size="sm" className="space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Hoy</span>
        </Button>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
            <span className="text-xs text-white">3</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
