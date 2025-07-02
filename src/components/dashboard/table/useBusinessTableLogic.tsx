
import { useState, useMemo } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { calcularValorNegocio, analyzeBusinessState } from '@/utils/businessCalculations';
import { Negocio } from '@/types';

export const useBusinessTableLogic = () => {
  const { negocios, loading, cambiarEstadoNegocio } = useNegocio();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'numero' | 'fecha' | 'valor'>('numero');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showInconsistenciesOnly, setShowInconsistenciesOnly] = useState(false);

  const obtenerNombreEmpresa = (negocio: Negocio) => {
    if (negocio.productora) {
      return negocio.productora.nombre;
    }
    if (negocio.clienteFinal) {
      return negocio.clienteFinal.nombre;
    }
    return 'Sin empresa asignada';
  };

  // Analyze all businesses for state consistency
  const businessesWithAnalysis = useMemo(() => {
    return negocios.map(negocio => {
      const analysis = analyzeBusinessState(negocio);
      return {
        ...negocio,
        stateAnalysis: analysis
      };
    });
  }, [negocios]);

  const filteredAndSortedNegocios = useMemo(() => {
    let filtered = businessesWithAnalysis.filter(negocio => {
      const matchesSearch = 
        negocio.numero.toString().includes(searchTerm.toLowerCase()) ||
        `${negocio.contacto.nombre} ${negocio.contacto.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obtenerNombreEmpresa(negocio).toLowerCase().includes(searchTerm.toLowerCase()) ||
        negocio.evento.nombreEvento.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || negocio.estado === statusFilter;
      
      const matchesInconsistencyFilter = !showInconsistenciesOnly || negocio.stateAnalysis.hasInconsistency;

      return matchesSearch && matchesStatus && matchesInconsistencyFilter;
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
  }, [businessesWithAnalysis, searchTerm, statusFilter, sortBy, sortOrder, showInconsistenciesOnly]);

  const handleSortChange = (newSortBy: 'numero' | 'fecha' | 'valor', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Statistics about state consistency
  const stateStats = useMemo(() => {
    const total = businessesWithAnalysis.length;
    const inconsistent = businessesWithAnalysis.filter(n => n.stateAnalysis.hasInconsistency).length;
    const consistent = total - inconsistent;
    
    return {
      total,
      consistent,
      inconsistent,
      consistencyRate: total > 0 ? ((consistent / total) * 100).toFixed(1) : '0'
    };
  }, [businessesWithAnalysis]);

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
    filteredAndSortedNegocios,
    cambiarEstadoNegocio,
    showInconsistenciesOnly,
    setShowInconsistenciesOnly,
    stateStats
  };
};
