
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
import { LogOut, User, Settings, Shield } from 'lucide-react';

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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema de Gestión de Negocios
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-700">
                    {getUserDisplayName()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={navigateToSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración Personal</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem className="cursor-pointer" onClick={navigateToAdmin}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Panel de Administración</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
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
