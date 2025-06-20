
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import DashboardNegocios from '@/components/DashboardNegocios';
import WizardCrearNegocio from '@/components/WizardCrearNegocio';
import DetalleNegocio from '@/components/DetalleNegocio';
import StatsCards from '@/components/dashboard/StatsCards';
import QuickActions from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  Bell, 
  ChevronRight,
  Activity,
  Clock,
  Users,
  Target
} from 'lucide-react';

type Vista = 'dashboard' | 'crear-negocio' | 'detalle-negocio';

const Index = () => {
  const [vistaActual, setVistaActual] = useState<Vista>('dashboard');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<string | null>(null);

  const navegarACrearNegocio = () => {
    setVistaActual('crear-negocio');
  };

  const navegarADetalleNegocio = (negocioId: string) => {
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  const volverADashboard = () => {
    setVistaActual('dashboard');
    setNegocioSeleccionado(null);
  };

  const completarCreacionNegocio = (negocioId: string) => {
    setNegocioSeleccionado(negocioId);
    setVistaActual('detalle-negocio');
  };

  if (vistaActual === 'crear-negocio') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <WizardCrearNegocio
            onComplete={completarCreacionNegocio}
            onCancel={volverADashboard}
          />
        </div>
      </div>
    );
  }

  if (vistaActual === 'detalle-negocio' && negocioSeleccionado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <DetalleNegocio
            negocioId={negocioSeleccionado}
            onVolver={volverADashboard}
          />
        </div>
      </div>
    );
  }

  // Dashboard principal modernizado
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header del Dashboard */}
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

        {/* Cards de Estadísticas */}
        <StatsCards />

        {/* Grid principal */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Negocios */}
            <Card className="modern-card animate-fade-in-scale">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Mis Negocios</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={navegarACrearNegocio}
                  className="hover-glow"
                >
                  Ver todos
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <DashboardNegocios
                  onCrearNegocio={navegarACrearNegocio}
                  onVerNegocio={navegarADetalleNegocio}
                />
              </CardContent>
            </Card>

            {/* Actividad Reciente */}
            <Card className="modern-card animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <span>Actividad Reciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
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
                  ].map((item, index) => (
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Acciones Rápidas */}
            <div className="animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
              <QuickActions onCrearNegocio={navegarACrearNegocio} />
            </div>

            {/* Objetivos */}
            <Card className="modern-card animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span>Objetivos del Mes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Nuevos Clientes</span>
                      <span className="font-medium">18/25</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ingresos Meta</span>
                      <span className="font-medium">$89K/$100K</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '89%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Proyectos Completados</span>
                      <span className="font-medium">12/15</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen del Equipo */}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
