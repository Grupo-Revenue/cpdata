
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
import AdminLineasProducto from '@/components/admin/AdminLineasProducto';
import { AdminTiposEvento } from '@/components/admin/AdminTiposEvento';
import AdminTermsConfig from '@/components/admin/AdminTermsConfig';
import AdminMarca from '@/components/admin/AdminMarca';
import AdminEstadisticas from '@/components/admin/AdminEstadisticas';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { PERMISSIONS } from '@/constants/permissions';
import { ACCESS_DENIED_MESSAGES } from '@/components/AccessDeniedInfo';

const Admin = () => {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const { toast } = useToast()
  const navigate = useNavigate()

  // Removed duplicate admin check - ProtectedFeature already handles this

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
      console.log('🚀 [Admin] Creating user via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: email,
          password: password
        }
      });

      // Primero verificar si hay un error específico en data
      if (data?.error) {
        console.error('❌ [Admin] Error in response:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return;
      }

      // Luego verificar el error genérico HTTP
      if (error) {
        console.error('❌ [Admin] Error from Edge Function:', error);
        toast({
          title: "Error",
          description: error.message || "Error al crear usuario",
          variant: "destructive",
        })
        return;
      }

      console.log('✅ [Admin] User created successfully:', data);
      
      toast({
        title: "Éxito",
        description: "Usuario creado exitosamente.",
      })
      setEmail("")
      setPassword("")
      
      // Trigger refresh of the user table
      window.dispatchEvent(new CustomEvent('userCreated'))
      
    } catch (error: any) {
      console.error('❌ [Admin] Unexpected error:', error);
      toast({
        title: "Error",
        description: error.message || "Error inesperado al crear usuario",
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
            <TabsTrigger value="lineas-producto">Líneas de Producto</TabsTrigger>
            <TabsTrigger value="tipos-evento">Tipos de Evento</TabsTrigger>
            <TabsTrigger value="terminos">Términos y Condiciones</TabsTrigger>
            <TabsTrigger value="marca">Marca</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
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
          <TabsContent value="lineas-producto">
            <ProtectedFeature 
              permission={PERMISSIONS.CREATE_PRODUCTS}
              showInlineInfo={true}
              infoMessage={ACCESS_DENIED_MESSAGES.CREATE_PRODUCT_LINES}
            >
              <AdminLineasProducto />
            </ProtectedFeature>
          </TabsContent>
          <TabsContent value="tipos-evento">
            <ProtectedFeature 
              permission={PERMISSIONS.ACCESS_ADMIN}
              showInlineInfo={true}
              infoMessage={{
                feature: "Gestión de Tipos de Evento",
                description: "Solo los administradores pueden gestionar los tipos de evento."
              }}
            >
              <AdminTiposEvento />
            </ProtectedFeature>
          </TabsContent>
          <TabsContent value="terminos">
            <ProtectedFeature 
              permission={PERMISSIONS.ACCESS_ADMIN}
              showInlineInfo={true}
              infoMessage={{
                feature: "Configuración de Términos y Condiciones",
                description: "Solo los administradores pueden modificar los términos y condiciones."
              }}
            >
              <AdminTermsConfig />
            </ProtectedFeature>
          </TabsContent>
          <TabsContent value="marca">
            <ProtectedFeature 
              permission={PERMISSIONS.ACCESS_ADMIN}
              showInlineInfo={true}
              infoMessage={{
                feature: "Configuración de Marca",
                description: "Solo los administradores pueden modificar la configuración de marca."
              }}
            >
              <AdminMarca />
            </ProtectedFeature>
          </TabsContent>
          <TabsContent value="estadisticas">
            <ProtectedFeature 
              permission={PERMISSIONS.ACCESS_ADMIN}
              showInlineInfo={true}
              infoMessage={{
                feature: "Estadísticas",
                description: "Solo los administradores pueden ver estadísticas y gráficos."
              }}
            >
              <AdminEstadisticas />
            </ProtectedFeature>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedFeature>
  );
};

export default Admin;
