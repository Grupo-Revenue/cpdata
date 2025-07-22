
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

import { UserTable } from '@/components/admin/UserTable';
import AdminProductos from '@/components/admin/AdminProductos';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { PERMISSIONS } from '@/constants/permissions';
import { ACCESS_DENIED_MESSAGES } from '@/components/AccessDeniedInfo';

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
    <ProtectedFeature permission={PERMISSIONS.ACCESS_ADMIN}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
            <p className="text-gray-600">Gestiona usuarios, productos y configuración del sistema</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>
          <TabsContent value="usuarios">
            <ProtectedFeature 
              permission={PERMISSIONS.CREATE_USERS}
              showInlineInfo={true}
              infoMessage={ACCESS_DENIED_MESSAGES.CREATE_USERS}
            >
              <UserTable 
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                handleCreateUser={handleCreateUser}
              />
            </ProtectedFeature>
          </TabsContent>
          <TabsContent value="productos">
            <ProtectedFeature 
              permission={PERMISSIONS.CREATE_PRODUCTS}
              showInlineInfo={true}
              infoMessage={ACCESS_DENIED_MESSAGES.CREATE_PRODUCTS}
            >
              <AdminProductos />
            </ProtectedFeature>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedFeature>
  );
};

export default Admin;
