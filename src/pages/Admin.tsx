
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Package, Palette, Settings, Database } from 'lucide-react';
import AdminUsuarios from '@/components/admin/AdminUsuarios';
import AdminProductos from '@/components/admin/AdminProductos';
import AdminMarca from '@/components/admin/AdminMarca';
import AdminLineasProducto from '@/components/admin/AdminLineasProducto';
import BusinessStateManager from '@/components/admin/BusinessStateManager';
import { useAuth } from '@/context/AuthContext';

const Admin = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('estados');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <Shield className="w-5 h-5" />
              <span>Acceso Denegado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              No tienes permisos para acceder al panel de administración.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios, productos y configuración del sistema</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="estados" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Estados</span>
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="productos" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Productos</span>
            </TabsTrigger>
            <TabsTrigger value="lineas" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Líneas</span>
            </TabsTrigger>
            <TabsTrigger value="marca" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Marca</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estados" className="mt-6">
            <BusinessStateManager />
          </TabsContent>

          <TabsContent value="usuarios" className="mt-6">
            <AdminUsuarios />
          </TabsContent>

          <TabsContent value="productos" className="mt-6">
            <AdminProductos />
          </TabsContent>

          <TabsContent value="lineas" className="mt-6">
            <AdminLineasProducto />
          </TabsContent>

          <TabsContent value="marca" className="mt-6">
            <AdminMarca />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Configuraciones adicionales del sistema (próximamente)</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
