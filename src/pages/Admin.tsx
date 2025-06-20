
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Package, 
  Palette, 
  Settings, 
  Shield, 
  ArrowLeft,
  Building2,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import AdminUsuarios from '@/components/admin/AdminUsuarios';
import AdminProductos from '@/components/admin/AdminProductos';
import AdminLineasProducto from '@/components/admin/AdminLineasProducto';
import AdminMarca from '@/components/admin/AdminMarca';

interface AdminProps {
  onVolver: () => void;
}

const Admin: React.FC<AdminProps> = ({ onVolver }) => {
  const { user, isAdmin } = useAuth();
  const [tabActiva, setTabActiva] = useState('usuarios');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes permisos para acceder a la sección de administración.
            </p>
            <Button onClick={onVolver} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestión del sistema y configuraciones</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            Administrador
          </Badge>
          <Button onClick={onVolver} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Negocios Activos</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Presupuestos</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas de Administración */}
      <Tabs value={tabActiva} onValueChange={setTabActiva} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="lineas" className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Líneas</span>
          </TabsTrigger>
          <TabsTrigger value="productos" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Productos</span>
          </TabsTrigger>
          <TabsTrigger value="marca" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Marca</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <AdminUsuarios />
        </TabsContent>

        <TabsContent value="lineas">
          <AdminLineasProducto />
        </TabsContent>

        <TabsContent value="productos">
          <AdminProductos />
        </TabsContent>

        <TabsContent value="marca">
          <AdminMarca />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
