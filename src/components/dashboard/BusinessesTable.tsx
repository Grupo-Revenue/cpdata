
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNegocio } from '@/context/NegocioContext';
import { calcularValorNegocio, obtenerEstadoNegocioInfo } from '@/utils/businessCalculations';
import { formatearPrecio } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, Filter, Eye, Building2 } from 'lucide-react';
import { Negocio } from '@/types';

interface BusinessesTableProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const BusinessesTable: React.FC<BusinessesTableProps> = ({ onCrearNegocio, onVerNegocio }) => {
  const { negocios, loading } = useNegocio();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'numero' | 'fecha' | 'valor'>('numero');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha por definir';
    }
  };

  const obtenerNombreEmpresa = (negocio: Negocio) => {
    if (negocio.productora) {
      return negocio.productora.nombre;
    }
    if (negocio.clienteFinal) {
      return negocio.clienteFinal.nombre;
    }
    return 'Sin empresa asignada';
  };

  const filteredAndSortedNegocios = useMemo(() => {
    let filtered = negocios.filter(negocio => {
      const matchesSearch = 
        negocio.numero.toString().includes(searchTerm.toLowerCase()) ||
        `${negocio.contacto.nombre} ${negocio.contacto.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obtenerNombreEmpresa(negocio).toLowerCase().includes(searchTerm.toLowerCase()) ||
        negocio.evento.nombreEvento.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || negocio.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'numero':
          comparison = a.numero - b.numero;
          break;
        case 'fecha':
          comparison = new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
          break;
        case 'valor':
          comparison = calcularValorNegocio(a) - calcularValorNegocio(b);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [negocios, searchTerm, statusFilter, sortBy, sortOrder]);

  const estadosDisponibles = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'prospecto', label: 'Prospecto' },
    { value: 'activo', label: 'Activo' },
    { value: 'revision_pendiente', label: 'Revisión pendiente' },
    { value: 'en_negociacion', label: 'En negociación' },
    { value: 'parcialmente_ganado', label: 'Parcialmente ganado' },
    { value: 'ganado', label: 'Ganado' },
    { value: 'perdido', label: 'Perdido' }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando negocios...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="text-xl font-semibold">Negocios</CardTitle>
          <Button onClick={onCrearNegocio} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Negocio
          </Button>
        </div>
        
        {/* Filtros y búsqueda */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por número, contacto, empresa o evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estadosDisponibles.map(estado => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numero-desc">Número (más reciente)</SelectItem>
                <SelectItem value="numero-asc">Número (más antiguo)</SelectItem>
                <SelectItem value="fecha-desc">Fecha (más reciente)</SelectItem>
                <SelectItem value="fecha-asc">Fecha (más antiguo)</SelectItem>
                <SelectItem value="valor-desc">Valor (mayor)</SelectItem>
                <SelectItem value="valor-asc">Valor (menor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAndSortedNegocios.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {negocios.length === 0 ? 'No hay negocios aún' : 'No se encontraron negocios'}
            </h3>
            <p className="text-gray-600 mb-4">
              {negocios.length === 0 
                ? 'Comience creando su primer negocio' 
                : 'Intente ajustar los filtros de búsqueda'
              }
            </p>
            {negocios.length === 0 && (
              <Button onClick={onCrearNegocio} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Negocio
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Fecha Evento</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedNegocios.map((negocio) => {
                  const { colorEstado } = obtenerEstadoNegocioInfo(negocio);
                  const valorTotal = calcularValorNegocio(negocio);
                  
                  return (
                    <TableRow key={negocio.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        #{negocio.numero}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {negocio.contacto.nombre} {negocio.contacto.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            {negocio.contacto.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {obtenerNombreEmpresa(negocio)}
                        </div>
                        {negocio.productora && negocio.clienteFinal && (
                          <div className="text-sm text-gray-500">
                            Cliente: {negocio.clienteFinal.nombre}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {negocio.evento.nombreEvento}
                        </div>
                        <div className="text-sm text-gray-500">
                          {negocio.evento.tipoEvento}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${colorEstado} border`}>
                          {negocio.estado.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {valorTotal > 0 ? formatearPrecio(valorTotal) : 'Sin presupuestos'}
                      </TableCell>
                      <TableCell>
                        {negocio.evento.fechaEvento 
                          ? formatearFecha(negocio.evento.fechaEvento)
                          : 'Por definir'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onVerNegocio(negocio.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredAndSortedNegocios.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredAndSortedNegocios.length} de {negocios.length} negocios
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessesTable;
