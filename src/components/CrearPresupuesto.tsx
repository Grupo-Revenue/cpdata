
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNegocio } from '@/context/NegocioContext';
import { ProductoPresupuesto } from '@/types';
import { ArrowLeft, Plus, Trash2, ShoppingCart, Package, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatearPrecio } from '@/utils/formatters';
import { useProductosBiblioteca, ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';

interface CrearPresupuestoProps {
  negocioId: string;
  presupuestoId?: string | null;
  onCerrar: () => void;
}

const CrearPresupuesto: React.FC<CrearPresupuestoProps> = ({ negocioId, presupuestoId, onCerrar }) => {
  const { obtenerNegocio, crearPresupuesto, actualizarPresupuesto } = useNegocio();
  const { productos: productosBiblioteca, loading: loadingProductos } = useProductosBiblioteca();
  const [productos, setProductos] = useState<ProductoPresupuesto[]>([]);
  const [productoPersonalizado, setProductoPersonalizado] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0
  });

  const negocio = obtenerNegocio(negocioId);
  const presupuestoExistente = presupuestoId ? 
    negocio?.presupuestos.find(p => p.id === presupuestoId) : null;

  useEffect(() => {
    if (presupuestoExistente) {
      setProductos(presupuestoExistente.productos);
    }
  }, [presupuestoExistente]);

  if (!negocio) {
    return <div>Negocio no encontrado</div>;
  }

  const agregarProductoBiblioteca = (productoBiblioteca: ProductoBiblioteca) => {
    const nuevoProducto: ProductoPresupuesto = {
      id: `producto-${Date.now()}`,
      nombre: productoBiblioteca.nombre,
      descripcion: productoBiblioteca.descripcion || '',
      cantidad: 1,
      precioUnitario: productoBiblioteca.precio_base,
      total: productoBiblioteca.precio_base
    };

    setProductos(prev => [...prev, nuevoProducto]);
    
    toast({
      title: "Producto agregado",
      description: `${productoBiblioteca.nombre} ha sido agregado al presupuesto`,
    });
  };

  const agregarProductoPersonalizado = () => {
    if (!productoPersonalizado.nombre || productoPersonalizado.precioUnitario <= 0) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos del producto",
        variant: "destructive"
      });
      return;
    }

    const nuevoProducto: ProductoPresupuesto = {
      id: `producto-${Date.now()}`,
      ...productoPersonalizado,
      total: productoPersonalizado.cantidad * productoPersonalizado.precioUnitario
    };

    setProductos(prev => [...prev, nuevoProducto]);
    setProductoPersonalizado({
      nombre: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0
    });

    toast({
      title: "Producto agregado",
      description: `${nuevoProducto.nombre} ha sido agregado al presupuesto`,
    });
  };

  const actualizarProducto = (id: string, campo: keyof ProductoPresupuesto, valor: any) => {
    setProductos(prev => prev.map(producto => {
      if (producto.id === id) {
        const productoActualizado = { ...producto, [campo]: valor };
        if (campo === 'cantidad' || campo === 'precioUnitario') {
          productoActualizado.total = productoActualizado.cantidad * productoActualizado.precioUnitario;
        }
        return productoActualizado;
      }
      return producto;
    }));
  };

  const eliminarProducto = (id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const calcularTotal = () => {
    return productos.reduce((total, producto) => total + producto.total, 0);
  };

  const guardarPresupuesto = () => {
    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe agregar al menos un producto al presupuesto",
        variant: "destructive"
      });
      return;
    }

    if (presupuestoId) {
      actualizarPresupuesto(negocioId, presupuestoId, productos);
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado exitosamente",
      });
    } else {
      crearPresupuesto(negocioId, productos);
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado exitosamente",
      });
    }

    onCerrar();
  };

  // Agrupar productos por línea de producto o categoría
  const productosAgrupados = productosBiblioteca.reduce((acc, producto) => {
    const categoria = producto.linea_producto?.nombre || producto.categoria || 'Sin categoría';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(producto);
    return acc;
  }, {} as Record<string, ProductoBiblioteca[]>);

  const categorias = Object.keys(productosAgrupados);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCerrar}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {presupuestoId ? 'Editar' : 'Crear'} Presupuesto
            </h1>
            <p className="text-gray-600">Negocio #{negocio.numero} - {negocio.evento.nombreEvento}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total del Presupuesto</p>
          <p className="text-3xl font-bold text-green-600">{formatearPrecio(calcularTotal())}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Productos */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="biblioteca" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="biblioteca">Biblioteca de Productos</TabsTrigger>
              <TabsTrigger value="personalizado">Producto Personalizado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="biblioteca" className="space-y-4">
              {loadingProductos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Cargando productos...</p>
                  </div>
                </div>
              ) : categorias.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos disponibles</h3>
                    <p className="text-gray-600">Los productos deben ser creados desde la sección de administración</p>
                  </CardContent>
                </Card>
              ) : (
                categorias.map(categoria => (
                  <Card key={categoria}>
                    <CardHeader>
                      <CardTitle className="text-lg">{categoria}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productosAgrupados[categoria].map(producto => (
                          <div key={producto.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{producto.nombre}</h4>
                              <Badge variant="outline">{formatearPrecio(producto.precio_base)}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{producto.descripcion}</p>
                            <Button 
                              size="sm" 
                              onClick={() => agregarProductoBiblioteca(producto)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="personalizado">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Crear Producto Personalizado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombrePersonalizado">Nombre del Producto</Label>
                      <Input
                        id="nombrePersonalizado"
                        value={productoPersonalizado.nombre}
                        onChange={(e) => setProductoPersonalizado({
                          ...productoPersonalizado, 
                          nombre: e.target.value
                        })}
                        placeholder="Ingrese el nombre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="precioPersonalizado">Precio Unitario (CLP)</Label>
                      <Input
                        id="precioPersonalizado"
                        type="number"
                        step="1"
                        value={productoPersonalizado.precioUnitario}
                        onChange={(e) => setProductoPersonalizado({
                          ...productoPersonalizado, 
                          precioUnitario: parseFloat(e.target.value) || 0
                        })}
                        placeholder="Ej: 15000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="descripcionPersonalizada">Descripción</Label>
                    <Input
                      id="descripcionPersonalizada"
                      value={productoPersonalizado.descripcion}
                      onChange={(e) => setProductoPersonalizado({
                        ...productoPersonalizado, 
                        descripcion: e.target.value
                      })}
                      placeholder="Descripción del producto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cantidadPersonalizada">Cantidad</Label>
                    <Input
                      id="cantidadPersonalizada"
                      type="number"
                      min="1"
                      value={productoPersonalizado.cantidad}
                      onChange={(e) => setProductoPersonalizado({
                        ...productoPersonalizado, 
                        cantidad: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                  <Button 
                    onClick={agregarProductoPersonalizado} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel del Carrito */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Productos Seleccionados ({productos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productos.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  No hay productos seleccionados
                </p>
              ) : (
                <div className="space-y-4">
                  {productos.map((producto) => (
                    <div key={producto.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{producto.nombre}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarProducto(producto.id)}
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{producto.descripcion}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            min="1"
                            value={producto.cantidad}
                            onChange={(e) => actualizarProducto(
                              producto.id, 
                              'cantidad', 
                              parseInt(e.target.value) || 1
                            )}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Precio Unit. (CLP)</Label>
                          <Input
                            type="number"
                            step="1"
                            value={producto.precioUnitario}
                            onChange={(e) => actualizarProducto(
                              producto.id, 
                              'precioUnitario', 
                              parseFloat(e.target.value) || 0
                            )}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatearPrecio(producto.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatearPrecio(calcularTotal())}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={guardarPresupuesto} 
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {presupuestoId ? 'Actualizar' : 'Crear'} Presupuesto
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrearPresupuesto;
