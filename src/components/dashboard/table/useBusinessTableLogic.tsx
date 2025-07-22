
import { useState, useMemo } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { calculateBusinessValue } from '@/utils/businessValueCalculator';
import { analyzeBusinessState } from '@/utils/businessCalculations';
import { Negocio } from '@/types';

export const useBusinessTableLogic = () => {
  const { negocios, loading, cambiarEstadoNegocio } = useNegocio();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'numero' | 'fecha' | 'valor'>('numero');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showInconsistenciesOnly, setShowInconsistenciesOnly] = useState(false);

  console.log('[useBusinessTableLogic] ==> HOOK CALLED <==');
  console.log('[useBusinessTableLogic] Current state:', {
    negociosCount: negocios.length,
    loading,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    showInconsistenciesOnly
  });

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
    console.log('[useBusinessTableLogic] ==> ANALYZING BUSINESSES <==');
    console.log('[useBusinessTableLogic] Raw negocios:', negocios.length);
    
    const analyzed = negocios.map(negocio => {
      const analysis = analyzeBusinessState(negocio);
      return {
        ...negocio,
        stateAnalysis: analysis
      };
    });
    
    console.log('[useBusinessTableLogic] Analyzed businesses:', {
      count: analyzed.length,
      firstFew: analyzed.slice(0, 3).map(n => ({
        id: n.id,
        numero: n.numero,
        hasInconsistency: n.stateAnalysis?.hasInconsistency
      }))
    });
    
    return analyzed;
  }, [negocios]);

  const filteredAndSortedNegocios = useMemo(() => {
    console.log('[useBusinessTableLogic] ==> FILTERING AND SORTING <==');
    console.log('[useBusinessTableLogic] Input businesses:', businessesWithAnalysis.length);
    
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

    console.log('[useBusinessTableLogic] After filtering:', {
      count: filtered.length,
      searchTerm,
      statusFilter,
      showInconsistenciesOnly
    });

    // Ordenar usando la nueva función de cálculo de valor
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
          comparison = calculateBusinessValue(a) - calculateBusinessValue(b);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    console.log('[useBusinessTableLogic] Final filtered and sorted:', {
      count: filtered.length,
      sortBy,
      sortOrder,
      firstFew: filtered.slice(0, 3).map(n => ({
        id: n.id,
        numero: n.numero,
        evento: n.evento?.nombreEvento
      }))
    });

    return filtered;
  }, [businessesWithAnalysis, searchTerm, statusFilter, sortBy, sortOrder, showInconsistenciesOnly]);

  const handleSortChange = (newSortBy: 'numero' | 'fecha' | 'valor', newSortOrder: 'asc' | 'desc') => {
    console.log('[useBusinessTableLogic] Sort change requested:', { newSortBy, newSortOrder });
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Statistics about state consistency
  const stateStats = useMemo(() => {
    const total = businessesWithAnalysis.length;
    const inconsistent = businessesWithAnalysis.filter(n => n.stateAnalysis.hasInconsistency).length;
    const consistent = total - inconsistent;
    
    const stats = {
      total,
      consistent,
      inconsistent,
      consistencyRate: total > 0 ? ((consistent / total) * 100).toFixed(1) : '0'
    };
    
    console.log('[useBusinessTableLogic] State stats:', stats);
    
    return stats;
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
