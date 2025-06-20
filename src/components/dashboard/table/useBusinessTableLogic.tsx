
import { useState, useMemo } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import { Negocio } from '@/types';

export const useBusinessTableLogic = () => {
  const { negocios, loading } = useNegocio();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'numero' | 'fecha' | 'valor'>('numero');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const handleSortChange = (newSortBy: 'numero' | 'fecha' | 'valor', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  return {
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
  };
};
