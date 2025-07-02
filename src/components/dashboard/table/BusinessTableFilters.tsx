
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

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
  const handleSortClick = (newSortBy: 'numero' | 'fecha' | 'valor') => {
    if (sortBy === newSortBy) {
      onSortChange(newSortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(newSortBy, 'desc');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar por número, contacto, empresa o evento..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white border-slate-200"
        />
      </div>
      
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-48 bg-white border-slate-200">
            <Filter className="w-4 h-4 mr-2 text-slate-500" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="oportunidad_creada">Oportunidad Creada</SelectItem>
            <SelectItem value="presupuesto_enviado">Presupuesto Enviado</SelectItem>
            <SelectItem value="negocio_aceptado">Negocio Aceptado</SelectItem>
            <SelectItem value="parcialmente_aceptado">Parcialmente Aceptado</SelectItem>
            <SelectItem value="negocio_perdido">Negocio Perdido</SelectItem>
            <SelectItem value="negocio_cerrado">Negocio Cerrado</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          onClick={() => handleSortClick('numero')}
          className={`${sortBy === 'numero' ? 'bg-slate-100' : ''}`}
        >
          <ArrowUpDown className="w-4 h-4 mr-1" />
          Número
          {sortBy === 'numero' && (
            <span className="ml-1 text-xs">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleSortClick('fecha')}
          className={`${sortBy === 'fecha' ? 'bg-slate-100' : ''}`}
        >
          <ArrowUpDown className="w-4 h-4 mr-1" />
          Fecha
          {sortBy === 'fecha' && (
            <span className="ml-1 text-xs">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleSortClick('valor')}
          className={`${sortBy === 'valor' ? 'bg-slate-100' : ''}`}
        >
          <ArrowUpDown className="w-4 h-4 mr-1" />
          Valor
          {sortBy === 'valor' && (
            <span className="ml-1 text-xs">
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BusinessTableFilters;
