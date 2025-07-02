
import React from 'react';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Shield, Building2 } from 'lucide-react';

const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();

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

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  BusinessFlow
                </h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
              </div>
            </div>
          </div>
          
          {/* Botones de acción y perfil */}
          <div className="flex items-center space-x-3">
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
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <User className="mr-3 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">Mi Perfil</span>
                    <span className="text-xs text-muted-foreground">Gestionar información personal</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-accent/10 transition-colors" onClick={navigateToSettings}>
                  <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">Configuración</span>
                    <span className="text-xs text-muted-foreground">Preferencias y ajustes</span>
                  </div>
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-accent/10 transition-colors" onClick={navigateToAdmin}>
                    <Shield className="mr-3 h-4 w-4 text-accent" />
                    <div className="flex flex-col">
                      <span className="text-sm">Administración</span>
                      <span className="text-xs text-muted-foreground">Panel de control</span>
                    </div>
                  </DropdownMenuItem>
                )}
                
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
    </nav>
  );
};

export default Navigation;
