
import React, { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Profile from "@/components/settings/Profile"
import Brand from "@/components/settings/Brand"
import SyncConfiguration from "@/components/settings/SyncConfiguration";
import HubSpotConfig from "@/components/settings/HubSpotConfig";
import { HubSpotSyncMonitor } from '@/components/settings/HubSpotSyncMonitor';

import { HubSpotSyncManager } from '@/components/settings/HubSpotSyncManager';
import { useSearchParams } from 'react-router-dom';
import { User, Palette, Plug } from 'lucide-react';

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Validamos el tab inicial: si no es uno permitido, caemos en 'profile'
  const allowedTabs = new Set(['profile', 'brand', 'hubspot']);
  const tabParam = searchParams.get('tab') || 'profile';
  const initialTab = allowedTabs.has(tabParam) ? tabParam : 'profile';

  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', activeTab);
    setSearchParams(sp, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  React.useEffect(() => {
    document.title = "Configuración de cuenta | Perfil y seguridad";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Configura tu perfil, marca y sincronización con HubSpot.');
    // Canonical tag for SEO
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', window.location.origin + '/settings');
  }, []);

  return (
    <DashboardLayout>
      <main className="space-y-6 p-6 mx-auto max-w-5xl">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la configuración de tu cuenta y preferencias.
          </p>
        </header>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2">
            <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Perfil</TabsTrigger>
            <TabsTrigger value="brand"><Palette className="mr-2 h-4 w-4" />Marca</TabsTrigger>
            <TabsTrigger value="hubspot"><Plug className="mr-2 h-4 w-4" />HubSpot</TabsTrigger>
            {/* Admin tab removed */}
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

          {/* Removed Admin content */}
        </Tabs>
      </main>
    </DashboardLayout>
  );
};

export default Settings;
