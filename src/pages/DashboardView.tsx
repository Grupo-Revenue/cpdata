
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompactDashboardHeader from '@/components/dashboard/CompactDashboardHeader';
import BusinessesTable from '@/components/dashboard/BusinessesTable';
import RealTimeStateValidator from '@/components/business/RealTimeStateValidator';
import SyncMonitorDashboard from '@/components/business/SyncMonitorDashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Building2, Activity } from 'lucide-react';

interface DashboardViewProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCrearNegocio, onVerNegocio }) => {
  const [activeTab, setActiveTab] = useState('businesses');

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Real-time State Validator - Shows alerts for inconsistencies */}
        <RealTimeStateValidator />
        
        {/* Header */}
        <div className="mb-8">
          <CompactDashboardHeader onCrearNegocio={onCrearNegocio} />
        </div>

        {/* Debug Helper - Quick access to problematic business */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVerNegocio('d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9')}
            className="text-xs"
          >
            🔧 Ver Negocio #17662 (Debug)
          </Button>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="businesses" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Negocios</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Sincronización</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="space-y-0">
            <BusinessesTable 
              onCrearNegocio={onCrearNegocio}
              onVerNegocio={onVerNegocio}
            />
          </TabsContent>

          <TabsContent value="sync" className="space-y-0">
            <SyncMonitorDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
};

export default DashboardView;
