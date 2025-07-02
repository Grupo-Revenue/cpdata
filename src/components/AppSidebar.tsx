import React from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  ShoppingBag, 
  LayoutDashboard,
  Plus 
} from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { 
    title: 'Dashboard', 
    icon: LayoutDashboard, 
    action: 'volverADashboard' as const 
  },
  { 
    title: 'Negocios', 
    icon: Building2, 
    action: 'volverADashboard' as const 
  },
  { 
    title: 'Contactos', 
    icon: Users, 
    action: 'navegarAContactos' as const 
  },
  { 
    title: 'Empresas', 
    icon: FileText, 
    action: 'navegarAEmpresas' as const 
  },
  { 
    title: 'Productos', 
    icon: ShoppingBag, 
    action: 'navegarAProductos' as const 
  },
];

const quickActions = [
  { 
    title: 'Nuevo Negocio', 
    icon: Plus, 
    action: 'navegarACrearNegocio' as const 
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigation = useNavigation();

  const handleItemClick = (action: string) => {
    switch (action) {
      case 'volverADashboard':
        navigation.volverADashboard();
        break;
      case 'navegarACrearNegocio':
        navigation.navegarACrearNegocio();
        break;
      case 'navegarAContactos':
        // Add this method to useNavigation hook
        navigation.navegarAContactos();
        break;
      case 'navegarAEmpresas':
        navigation.navegarAEmpresas();
        break;
      case 'navegarAProductos':
        navigation.navegarAProductos();
        break;
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleItemClick(item.action)}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Acciones Rápidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleItemClick(item.action)}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}