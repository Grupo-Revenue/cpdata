
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, UserPlus, Shield, User, Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  empresa?: string;
  created_at: string;
  roles?: { role: string }[];
}

interface UserTableProps {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  handleCreateUser: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  email,
  password,
  setEmail,
  setPassword,
  handleCreateUser
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive"
        });
        return;
      }

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles",
          variant: "destructive"
        });
        return;
      }

      // Combine data
      const usersWithRoles = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        nombre: profile.nombre,
        apellido: profile.apellido,
        empresa: profile.empresa,
        created_at: profile.created_at,
        roles: roles?.filter(r => r.user_id === profile.id) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    // Prevenir que un admin se quite sus propios permisos
    if (currentUser?.id === userId && newRole === 'user') {
      toast({
        title: "Acción no permitida",
        description: "No puedes quitarte tus propios permisos de administrador",
        variant: "destructive"
      });
      return;
    }

    try {
      setChangingRole(userId);
      
      // Primero eliminar todos los roles existentes del usuario
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Luego insertar el nuevo rol
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole as 'admin' | 'user'
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Rol actualizado",
        description: `El usuario ahora tiene el rol: ${newRole === 'admin' ? 'Administrador' : 'Usuario'}`
      });

      // Recargar usuarios
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive"
      });
    } finally {
      setChangingRole(null);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (currentUser?.id === userId) {
      toast({
        title: "Acción no permitida",
        description: "No puedes eliminar tu propia cuenta",
        variant: "destructive"
      });
      return;
    }

    try {
      setDeletingUser(userId);
      
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userName} ha sido eliminado exitosamente`
      });

      // Recargar usuarios
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive"
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const getUserRole = (user: User): string => {
    if (!user.roles || user.roles.length === 0) {
      return 'user'; // Default role
    }
    
    // Si tiene rol admin, mostrarlo como prioridad
    if (user.roles.some(r => r.role === 'admin')) {
      return 'admin';
    }
    
    return user.roles[0].role || 'user';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <Shield className="w-3 h-3 mr-1" />
          Administrador
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        <User className="w-3 h-3 mr-1" />
        Usuario
      </Badge>
    );
  };

  useEffect(() => {
    fetchUsers();
    
    // Listen for user creation events to refresh the table
    const handleUserCreated = () => {
      console.log('👂 [UserTable] User created event received, refreshing...');
      fetchUsers();
    };
    
    window.addEventListener('userCreated', handleUserCreated);
    return () => window.removeEventListener('userCreated', handleUserCreated);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Crear un nuevo usuario</AlertDialogTitle>
                <AlertDialogDescription>
                  Ingrese el correo electrónico y la contraseña del nuevo usuario. Se le asignará el rol de usuario por defecto.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="col-span-3" 
                    type="email" 
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Contraseña
                  </Label>
                  <Input 
                    id="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="col-span-3" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateUser}>
                  Crear Usuario
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Rol Actual</TableHead>
              <TableHead>Fecha de Registro</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const currentRole = getUserRole(user);
              const isCurrentUser = currentUser?.id === user.id;
              const isChangingThisUser = changingRole === user.id;
              const isDeletingThisUser = deletingUser === user.id;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.nombre && user.apellido 
                            ? `${user.nombre} ${user.apellido}` 
                            : user.email.split('@')[0]
                          }
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">(Tú)</span>
                          )}
                        </div>
                        {user.nombre && (
                          <div className="text-sm text-gray-500">
                            {user.nombre} {user.apellido}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.empresa || '-'}</TableCell>
                  <TableCell>{getRoleBadge(currentRole)}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={currentRole}
                        onValueChange={(newRole) => changeUserRole(user.id, newRole)}
                        disabled={isChangingThisUser || (isCurrentUser && currentRole === 'admin')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuario</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      {isChangingThisUser && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {!isCurrentUser && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={isDeletingThisUser}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isDeletingThisUser ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente la cuenta de{' '}
                                <strong>
                                  {user.nombre && user.apellido 
                                    ? `${user.nombre} ${user.apellido}` 
                                    : user.email
                                  }
                                </strong>{' '}
                                ({user.email}). Esta acción no se puede deshacer.
                                <br /><br />
                                Todos los datos asociados al usuario serán eliminados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteUser(
                                  user.id, 
                                  user.nombre && user.apellido 
                                    ? `${user.nombre} ${user.apellido}` 
                                    : user.email
                                )}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar Usuario
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    {isCurrentUser && currentRole === 'admin' && (
                      <p className="text-xs text-gray-500 mt-1">
                        No puedes cambiar tu propio rol
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay usuarios registrados
          </h3>
          <p className="text-gray-600">
            Los usuarios aparecerán aquí una vez que se registren en el sistema
          </p>
        </div>
      )}
    </div>
  );
};
