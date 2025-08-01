import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBrandConfig } from '@/hooks/useBrandConfig';
import { useHubSpotConnectionStatus } from '@/hooks/useHubSpotConnectionStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { UserRoleIndicator } from '@/components/UserRoleIndicator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Shield, Building2 } from 'lucide-react';
const Navigation = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    config: brandConfig,
    loading: configLoading
  } = useBrandConfig();
  const {
    isConnected: hubspotConnected,
    isChecking: checkingConnection
  } = useHubSpotConnectionStatus();
  const {
    hasPermission
  } = usePermissions();
  const [imageError, setImageError] = useState(false);
  if (!user) return null;
  const getUserInitials = () => {
    if (user.user_metadata?.nombre && user.user_metadata?.apellido) {
      return `${user.user_metadata.nombre[0]}${user.user_metadata.apellido[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };
  const getUserDisplayName = () => {
    if (user.user_metadata?.nombre && user.user_metadata?.apellido) {
      return `${user.user_metadata.nombre} ${user.user_metadata.apellido}`;
    }
    if (user.user_metadata?.nombre) {
      return user.user_metadata.nombre;
    }
    return user.email;
  };
  const navigateToAdmin = () => {
    window.location.href = '/admin';
  };
  const navigateToSettings = () => {
    window.location.href = '/settings';
  };
  return <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo y título - Estructura unificada */}
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = '/'}>
            {brandConfig?.logo_url && !configLoading && !imageError && (
              <img 
                src={brandConfig.logo_url} 
                alt={brandConfig.nombre_empresa || 'Logo'} 
                className="h-10 w-auto max-w-[200px] object-contain" 
                onLoad={() => setImageError(false)} 
                onError={() => setImageError(true)} 
              />
            )}
            
          </div>
          
          {/* Botones de acción y perfil */}
          <div className="flex items-center space-x-3">
            {/* Indicador de conexión HubSpot */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {checkingConnection ? <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div> : <div className={`w-2 h-2 rounded-full ${hubspotConnected ? 'bg-green-500' : 'bg-red-500'}`} title={hubspotConnected ? 'HubSpot conectado' : 'HubSpot desconectado'}></div>}
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  HubSpot
                </span>
              </div>
            </div>

            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-transparent hover:border-primary/20 transition-all duration-200">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                          {user.email}
                        </p>
                        <div className="mt-2">
                          <UserRoleIndicator variant="outline" className="text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-accent/10 transition-colors" onClick={navigateToSettings}>
                  <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">Configuración</span>
                    <span className="text-xs text-muted-foreground">Preferencias y ajustes</span>
                  </div>
                </DropdownMenuItem>
                
                {hasPermission(PERMISSIONS.ACCESS_ADMIN) && <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-accent/10 transition-colors" onClick={navigateToAdmin}>
                    <Shield className="mr-3 h-4 w-4 text-accent" />
                    <div className="flex flex-col">
                      <span className="text-sm">Administración</span>
                      <span className="text-xs text-muted-foreground">Panel de control</span>
                    </div>
                  </DropdownMenuItem>}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-destructive/10 transition-colors text-destructive focus:text-destructive" onClick={signOut}>
                  <LogOut className="mr-3 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">Cerrar Sesión</span>
                    <span className="text-xs text-muted-foreground">Salir de la aplicación</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>;
};
export default Navigation;