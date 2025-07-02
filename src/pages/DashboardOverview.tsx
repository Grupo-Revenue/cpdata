import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, FileText, ShoppingBag, Plus, TrendingUp } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import BusinessList from './business/BusinessList';

const DashboardOverview = () => {
  const { navegarACrearNegocio } = useNavigation();

  const stats = [
    {
      title: 'Negocios Activos',
      value: '12',
      description: 'En proceso',
      icon: Building2,
      color: 'text-primary'
    },
    {
      title: 'Contactos',
      value: '48',
      description: 'Total registrados',
      icon: Users,
      color: 'text-accent'
    },
    {
      title: 'Presupuestos',
      value: '8',
      description: 'Pendientes',
      icon: FileText,
      color: 'text-secondary-foreground'
    },
    {
      title: 'Productos',
      value: '156',
      description: 'En biblioteca',
      icon: ShoppingBag,
      color: 'text-muted-foreground'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Gestiona tus negocios y presupuestos de eventos
          </p>
        </div>
        <Button onClick={navegarACrearNegocio} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Negocio
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="modern-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>
            Tus negocios más recientes y próximas acciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessList isOverview />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;