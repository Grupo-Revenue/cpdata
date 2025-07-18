import React, { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Profile from "@/components/settings/Profile"
import Brand from "@/components/settings/Brand"
import SyncConfiguration from "@/components/settings/SyncConfiguration";
import HubSpotConfig from "@/components/settings/HubSpotConfig";
import { HubSpotSyncMonitor } from '@/components/settings/HubSpotSyncMonitor';

import { HubSpotSyncManager } from '@/components/settings/HubSpotSyncManager';

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la configuración de tu cuenta y preferencias.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="brand">Marca</TabsTrigger>
            <TabsTrigger value="hubspot">HubSpot</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Profile />
          </TabsContent>

          <TabsContent value="brand" className="space-y-4">
            <Brand />
          </TabsContent>

          <TabsContent value="hubspot" className="space-y-6">
            <div className="grid gap-6">
              <HubSpotConfig />
              <HubSpotSyncMonitor />
              <HubSpotSyncManager />
              <SyncConfiguration />
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <div>Admin</div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
