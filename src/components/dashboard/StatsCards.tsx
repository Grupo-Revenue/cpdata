
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp, Building2, Users, Package, DollarSign } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  trend,
  color 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500'
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500'
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
          <div className="flex items-center space-x-2 text-xs">
            <div className={`flex items-center space-x-1 ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-muted-foreground'
            }`}>
              {trend === 'up' && <ArrowUp className="h-3 w-3" />}
              {trend === 'down' && <ArrowDown className="h-3 w-3" />}
              {trend === 'neutral' && <TrendingUp className="h-3 w-3" />}
              <span className="font-medium">{change > 0 ? '+' : ''}{change}%</span>
            </div>
            <span className="text-muted-foreground">{changeLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatsCards: React.FC = () => {
  const stats = [
    {
      title: "Negocios Activos",
      value: "24",
      change: 12,
      changeLabel: "desde el mes pasado",
      icon: Building2,
      trend: 'up' as const,
      color: 'blue' as const
    },
    {
      title: "Clientes Totales",
      value: "1,284",
      change: 8,
      changeLabel: "desde el mes pasado",
      icon: Users,
      trend: 'up' as const,
      color: 'green' as const
    },
    {
      title: "Productos",
      value: "456",
      change: -2,
      changeLabel: "desde el mes pasado",
      icon: Package,
      trend: 'down' as const,
      color: 'purple' as const
    },
    {
      title: "Ingresos",
      value: "$89,240",
      change: 15,
      changeLabel: "desde el mes pasado",
      icon: DollarSign,
      trend: 'up' as const,
      color: 'orange' as const
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
