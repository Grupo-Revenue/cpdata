
import { Negocio } from '@/types';
import { useMemo } from 'react';
import { calculateBusinessValue } from './businessValueCalculator';

/**
 * Calcula el valor total del negocio usando la nueva lógica:
 * - Si hay presupuestos aprobados: aprobados - rechazados (no negativo)
 * - Si no hay aprobados pero hay publicados: suma de publicados
 * - Si solo hay rechazados: suma de rechazados
 */
export const calcularValorNegocio = (negocio: Negocio): number => {
  return calculateBusinessValue(negocio);
};

// Memoized version for use in components
export const useCalcularValorNegocio = (negocio: Negocio): number => {
  return useMemo(() => calcularValorNegocio(negocio), [negocio.presupuestos]);
};

/**
 * Obtiene información adicional sobre los presupuestos del negocio
 */
export const obtenerInfoPresupuestos = (negocio: Negocio) => {
  const totalPresupuestos = negocio.presupuestos.length;
  const presupuestosAprobados = negocio.presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosPublicados = negocio.presupuestos.filter(p => p.estado === 'publicado').length;
  const presupuestosBorrador = negocio.presupuestos.filter(p => p.estado === 'borrador').length;
  const presupuestosRechazados = negocio.presupuestos.filter(p => p.estado === 'rechazado').length;
  const presupuestosVencidos = negocio.presupuestos.filter(p => p.estado === 'vencido').length;
  const presupuestosFacturados = negocio.presupuestos.filter(p => p.estado === 'aprobado' && p.facturado === true).length;
  const presupuestosPendientes = negocio.presupuestos.filter(p => ['publicado', 'borrador'].includes(p.estado)).length;
  
  return {
    totalPresupuestos,
    presupuestosAprobados,
    presupuestosPublicados,
    presupuestosBorrador,
    presupuestosRechazados,
    presupuestosVencidos,
    presupuestosFacturados,
    presupuestosPendientes
  };
};

/**
 * Gets state colors using the design system
 */
export const getBusinessStateColors = (estado: string) => {
  const colors = {
    'oportunidad_creada': 'bg-business-oportunidad text-business-oportunidad-foreground border-business-oportunidad',
    'presupuesto_enviado': 'bg-business-presupuesto text-business-presupuesto-foreground border-business-presupuesto',
    'parcialmente_aceptado': 'bg-business-parcial text-business-parcial-foreground border-business-parcial',
    'negocio_aceptado': 'bg-business-aceptado text-business-aceptado-foreground border-business-aceptado',
    'negocio_cerrado': 'bg-business-cerrado text-business-cerrado-foreground border-business-cerrado',
    'negocio_perdido': 'bg-business-perdido text-business-perdido-foreground border-business-perdido'
  };
  
  return colors[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
};

/**
 * Analyzes business state and provides detailed information about expected vs actual state
 */
export const analyzeBusinessState = (negocio: Negocio) => {
  const info = obtenerInfoPresupuestos(negocio);
  let expectedState = '';
  
  // Determine expected state based on business rules
  if (info.totalPresupuestos === 0) {
    expectedState = 'oportunidad_creada';
  } else if (info.presupuestosAprobados > 0 && info.presupuestosFacturados === info.presupuestosAprobados) {
    expectedState = 'negocio_cerrado';
  } else if (info.presupuestosAprobados === info.totalPresupuestos) {
    expectedState = 'negocio_aceptado';
  } else if (info.presupuestosAprobados > 0 && info.presupuestosAprobados < info.totalPresupuestos) {
    expectedState = 'parcialmente_aceptado';
  } else if ((info.presupuestosRechazados + info.presupuestosVencidos) === info.totalPresupuestos) {
    expectedState = 'negocio_perdido';
  } else if (info.presupuestosPublicados > 0 || info.presupuestosBorrador > 0) {
    expectedState = 'presupuesto_enviado';
  } else {
    expectedState = 'oportunidad_creada';
  }
  
  const stateMatches = negocio.estado === expectedState;
  const hasInconsistency = !stateMatches;
  
  return {
    currentState: negocio.estado,
    expectedState,
    stateMatches,
    hasInconsistency,
    budgetInfo: info,
    analysis: {
      hasInconsistency,
      reason: hasInconsistency ? `Expected "${expectedState}" but found "${negocio.estado}"` : 'States match'
    }
  };
};

/**
 * Obtiene información de estado del negocio
 */
export const obtenerEstadoNegocioInfo = (negocio: Negocio) => {
  const info = obtenerInfoPresupuestos(negocio);
  let descripcionEstado = '';
  
  switch (negocio.estado) {
    case 'oportunidad_creada':
      descripcionEstado = 'Oportunidad identificada, sin presupuestos creados';
      break;
    case 'presupuesto_enviado':
      descripcionEstado = `${info.presupuestosPublicados} presupuesto(s) publicado(s) esperando respuesta`;
      break;
    case 'parcialmente_aceptado':
      descripcionEstado = `${info.presupuestosAprobados} de ${info.totalPresupuestos} presupuestos aprobados`;
      break;
    case 'negocio_aceptado':
      descripcionEstado = 'Todos los presupuestos aprobados, pendiente facturación';
      break;
    case 'negocio_cerrado':
      descripcionEstado = 'Negocio completado y facturado';
      break;
    case 'negocio_perdido':
      descripcionEstado = 'Presupuestos rechazados, vencidos o cancelados';
      break;
    default:
      descripcionEstado = 'Estado desconocido';
  }
  
  return {
    descripcionEstado,
    colorEstado: getBusinessStateColors(negocio.estado)
  };
};

/**
 * Formats business state for display
 */
export const formatBusinessStateForDisplay = (estado: string): string => {
  const displayNames: { [key: string]: string } = {
    'oportunidad_creada': 'Oportunidad',
    'presupuesto_enviado': 'Presupuesto Enviado',
    'parcialmente_aceptado': 'Parcialmente Aceptado',
    'negocio_aceptado': 'Aceptado',
    'negocio_cerrado': 'Cerrado',
    'negocio_perdido': 'Perdido'
  };
  
  return displayNames[estado] || estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ');
};

/**
 * Obtiene estadísticas agregadas para el dashboard
 */
export const obtenerEstadisticasDashboard = (negocios: Negocio[]) => {
  const totalNegocios = negocios.length;
  const valorTotalCartera = negocios.reduce((total, negocio) => total + calcularValorNegocio(negocio), 0);
  
  const estadisticasPorEstado = {
    oportunidad_creada: negocios.filter(n => n.estado === 'oportunidad_creada').length,
    presupuesto_enviado: negocios.filter(n => n.estado === 'presupuesto_enviado').length,
    parcialmente_aceptado: negocios.filter(n => n.estado === 'parcialmente_aceptado').length,
    negocio_aceptado: negocios.filter(n => n.estado === 'negocio_aceptado').length,
    negocio_cerrado: negocios.filter(n => n.estado === 'negocio_cerrado').length,
    negocio_perdido: negocios.filter(n => n.estado === 'negocio_perdido').length
  };

  const totalPresupuestos = negocios.reduce((total, negocio) => total + negocio.presupuestos.length, 0);
  
  return {
    totalNegocios,
    valorTotalCartera,
    estadisticasPorEstado,
    totalPresupuestos
  };
};

/**
 * Validates all business states and returns inconsistencies
 */
export const validateAllBusinessStates = (negocios: Negocio[]) => {
  const inconsistencies = [];
  const validStates = [];
  
  for (const negocio of negocios) {
    const analysis = analyzeBusinessState(negocio);
    
    if (analysis.hasInconsistency) {
      inconsistencies.push({
        negocioId: negocio.id,
        numero: negocio.numero,
        currentState: analysis.currentState,
        expectedState: analysis.expectedState,
        reason: analysis.analysis.reason,
        budgetInfo: analysis.budgetInfo
      });
    } else {
      validStates.push(negocio.id);
    }
  }
  
  return {
    totalBusinesses: negocios.length,
    validStates: validStates.length,
    inconsistencies: inconsistencies.length,
    inconsistentBusinesses: inconsistencies
  };
};
