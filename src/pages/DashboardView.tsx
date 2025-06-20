
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import BusinessSection from '@/components/dashboard/BusinessSection';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import GoalsWidget from '@/components/dashboard/GoalsWidget';
import TeamWidget from '@/components/dashboard/TeamWidget';

interface DashboardViewProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCrearNegocio, onVerNegocio }) => {
  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader />
        <StatsCards />
        
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <BusinessSection 
              onCrearNegocio={onCrearNegocio}
              onVerNegocio={onVerNegocio}
            />
            <ActivityFeed />
          </div>

          <div className="space-y-6">
            <div className="animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
              <QuickActions onCrearNegocio={onCrearNegocio} />
            </div>
            <GoalsWidget />
            <TeamWidget />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default DashboardView;
