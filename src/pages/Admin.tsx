
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import { UserTable } from '@/components/admin/UserTable';
import { ProductTable } from '@/components/admin/ProductTable';

const Admin = () => {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userRole, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (error || !userRole) {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleCreateUser = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos.",
        variant: "destructive",
      })
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            is_admin: false,
          }
        }
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return;
      }

      toast({
        title: "Success",
        description: "Usuario creado exitosamente.",
      })
      setEmail("")
      setPassword("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona usuarios, productos y configuración del sistema</p>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap">
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Crear Usuario</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Crear un nuevo usuario</AlertDialogTitle>
              <AlertDialogDescription>
                Ingrese el correo electrónico y la contraseña del nuevo usuario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" type="email" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" type="password" />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateUser}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios">
          <UserTable />
        </TabsContent>
        <TabsContent value="productos">
          <ProductTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
