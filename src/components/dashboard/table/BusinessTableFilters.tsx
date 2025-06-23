
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SortAsc, SortDesc } from 'lucide-react';

interface BusinessTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: 'numero' | 'fecha' | 'valor';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'numero' | 'fecha' | 'valor', sortOrder: 'asc' | 'desc') => void;
}

const BusinessTableFilters: React.FC<BusinessTableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  sortOrder,
  onSortChange
}) => {
  const handleSortToggle = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por número, contacto, empresa o evento..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="oportunidad_creada">Oportunidades</SelectItem>
            <SelectItem value="presupuesto_enviado">Presupuesto Enviado</SelectItem>
            <SelectItem value="parcialmente_aceptado">Parcialmente Aceptado</SelectItem>
            <SelectItem value="negocio_aceptado">Aceptado</SelectItem>
            <SelectItem value="negocio_cerrado">Cerrado</SelectItem>
            <SelectItem value="negocio_perdido">Perdido</SelectItem>
            {/* Legacy states for backward compatibility */}
            <SelectItem value="prospecto">Prospecto (Legacy)</SelectItem>
            <SelectItem value="activo">Activo (Legacy)</SelectItem>
            <SelectItem value="revision_pendiente">En Revisión (Legacy)</SelectItem>
            <SelectItem value="en_negociacion">En Negociación (Legacy)</SelectItem>
            <SelectItem value="parcialmente_ganado">Parcialmente Ganado (Legacy)</SelectItem>
            <SelectItem value="ganado">Ganado (Legacy)</SelectItem>
            <SelectItem value="perdido">Perdido (Legacy)</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(value: 'numero' | 'fecha' | 'valor') => onSortChange(value, sortOrder)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="numero">Número</SelectItem>
            <SelectItem value="fecha">Fecha</SelectItem>
            <SelectItem value="valor">Valor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSortToggle}
        className="flex items-center gap-2"
      >
        {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
        {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
      </Button>
    </div>
  );
};

export default BusinessTableFilters;
