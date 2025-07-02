
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, Building2, Users, FileText } from 'lucide-react';
import { useNegocio } from '@/context/NegocioContext';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  color 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500'
  };

  return (
    <Card className="modern-card group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && changeLabel && (
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1 text-green-600">
                <ArrowUp className="h-3 w-3" />
                <span className="font-medium">+{change}%</span>
              </div>
              <span className="text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StatsCards: React.FC = () => {
  const { negocios } = useNegocio();

  const stats = [
    {
      title: "Total Negocios",
      value: negocios.length.toString(),
      change: 12,
      changeLabel: "este mes",
      icon: Building2,
      color: 'blue' as const
    },
    {
      title: "Negocios en Proceso",
      value: negocios.filter(n => n.estado === 'presupuesto_enviado').length.toString(),
      icon: Users,
      color: 'green' as const
    },
    {
      title: "Total Presupuestos",
      value: negocios.reduce((total, n) => total + n.presupuestos.length, 0).toString(),
      icon: FileText,
      color: 'purple' as const
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => (
        <div 
          key={stat.title}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
