
import React from 'react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

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

  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por número, contacto, empresa o evento..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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

        <Select 
          value={`${sortBy}-${sortOrder}`} 
          onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
            onSortChange(newSortBy, newSortOrder);
          }}
        >
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
  );
};

export default BusinessTableFilters;
