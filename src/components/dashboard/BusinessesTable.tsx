
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import BusinessTableFilters from './table/BusinessTableFilters';
import BusinessTableRow from './table/BusinessTableRow';
import BusinessTableEmpty from './table/BusinessTableEmpty';
import { useBusinessTableLogic } from './table/useBusinessTableLogic';

interface BusinessesTableProps {
  onCrearNegocio: () => void;
  onVerNegocio: (negocioId: string) => void;
}

const BusinessesTable: React.FC<BusinessesTableProps> = ({ onCrearNegocio, onVerNegocio }) => {
  const {
    negocios,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortOrder,
    handleSortChange,
    filteredAndSortedNegocios
  } = useBusinessTableLogic();

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
        <CardTitle className="text-xl font-semibold">Negocios</CardTitle>
        
        <BusinessTableFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </CardHeader>

      <CardContent>
        {filteredAndSortedNegocios.length === 0 ? (
          <BusinessTableEmpty 
            hasNoBusinesses={negocios.length === 0}
            onCrearNegocio={onCrearNegocio}
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha Evento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedNegocios.map((negocio) => (
                  <BusinessTableRow 
                    key={negocio.id}
                    negocio={negocio}
                    onVerNegocio={onVerNegocio}
                  />
                ))}
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
