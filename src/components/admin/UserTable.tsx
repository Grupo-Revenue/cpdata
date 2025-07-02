
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
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  empresa?: string;
  created_at: string;
  roles?: { role: string }[];
}

export const UserTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with user roles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          nombre,
          apellido,
          empresa,
          created_at,
          user_roles!inner(role)
        `);

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive"
        });
        return;
      }

      setUsers(profiles || []);
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

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el rol del usuario",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Éxito",
        description: `Rol actualizado a ${newRole}`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el rol",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <Button onClick={fetchUsers} variant="outline">
          Actualizar
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha de Registro</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : '-'}</TableCell>
                <TableCell>{user.empresa || '-'}</TableCell>
                <TableCell>
                  <Badge variant={user.roles?.[0]?.role === 'admin' ? 'default' : 'secondary'}>
                    {user.roles?.[0]?.role || 'user'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleUserRole(user.id, user.roles?.[0]?.role || 'user')}
                  >
                    Cambiar Rol
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron usuarios
        </div>
      )}
    </div>
  );
};
