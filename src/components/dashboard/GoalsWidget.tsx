
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

const GoalsWidget: React.FC = () => {
  const goals = [
    {
      label: "Nuevos Clientes",
      current: 18,
      target: 25,
      color: "from-green-500 to-emerald-500"
    },
    {
      label: "Ingresos Meta",
      current: 89,
      target: 100,
      color: "from-blue-500 to-cyan-500",
      prefix: "$",
      suffix: "K"
    },
    {
      label: "Proyectos Completados",
      current: 12,
      target: 15,
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <Card className="modern-card animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-green-500" />
          <span>Objetivos del Mes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{goal.label}</span>
                <span className="font-medium">
                  {goal.prefix}{goal.current}{goal.suffix}/{goal.prefix}{goal.target}{goal.suffix}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${goal.color} h-2 rounded-full`} 
                  style={{ width: `${(goal.current / goal.target) * 100}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalsWidget;
