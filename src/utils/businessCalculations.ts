
import { Negocio } from '@/types';

/**
 * Calcula el valor total del negocio sumando todos los presupuestos
 */
export const calcularValorNegocio = (negocio: Negocio): number => {
  const total = negocio.presupuestos.reduce((total, presupuesto) => total + presupuesto.total, 0);
  console.log(`[businessCalculations] Calculated business value for ${negocio.id}: ${total} (from ${negocio.presupuestos.length} budgets)`);
  return total;
};

/**
 * Obtiene información adicional sobre los presupuestos del negocio
 */
export const obtenerInfoPresupuestos = (negocio: Negocio) => {
  const totalPresupuestos = negocio.presupuestos.length;
  const presupuestosAprobados = negocio.presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosEnviados = negocio.presupuestos.filter(p => p.estado === 'enviado').length;
  const presupuestosBorrador = negocio.presupuestos.filter(p => p.estado === 'borrador').length;
  const presupuestosRechazados = negocio.presupuestos.filter(p => p.estado === 'rechazado').length;
  const presupuestosVencidos = negocio.presupuestos.filter(p => p.estado === 'vencido').length;
  const presupuestosFacturados = negocio.presupuestos.filter(p => p.estado === 'aprobado' && p.facturado === true).length;
  const presupuestosPendientes = negocio.presupuestos.filter(p => ['enviado', 'borrador'].includes(p.estado)).length;
  
  const info = {
    totalPresupuestos,
    presupuestosAprobados,
    presupuestosEnviados,
    presupuestosBorrador,
    presupuestosRechazados,
    presupuestosVencidos,
    presupuestosFacturados,
    presupuestosPendientes
  };
  
  console.log(`[businessCalculations] Budget info for ${negocio.id}:`, info);
  
  return info;
};

/**
 * Maps old business states to new business states for display compatibility
 */
export const mapLegacyBusinessState = (estado: string): string => {
  const stateMapping: { [key: string]: string } = {
    'prospecto': 'oportunidad_creada',
    'activo': 'presupuesto_enviado',
    'revision_pendiente': 'presupuesto_enviado',
    'en_negociacion': 'presupuesto_enviado',
    'parcialmente_ganado': 'parcialmente_aceptado',
    'ganado': 'negocio_aceptado',
    'perdido': 'negocio_perdido',
    'cerrado': 'negocio_cerrado',
    'cancelado': 'negocio_perdido'
  };
  
  const mappedState = stateMapping[estado] || estado;
  if (mappedState !== estado) {
    console.log(`[businessCalculations] Mapped legacy state "${estado}" to "${mappedState}"`);
  }
  
  return mappedState;
};

/**
 * Analyzes business state and provides detailed information about expected vs actual state
 */
export const analyzeBusinessState = (negocio: Negocio) => {
  const info = obtenerInfoPresupuestos(negocio);
  let expectedState = '';
  
  console.log(`[businessCalculations] Analyzing business state for ${negocio.id}:`);
  console.log(`[businessCalculations] Current state: ${negocio.estado}`);
  console.log(`[businessCalculations] Budget breakdown:`, info);
  
  // Determine expected state based on business rules
  if (info.totalPresupuestos === 0) {
    expectedState = 'oportunidad_creada';
    console.log(`[businessCalculations] No budgets → oportunidad_creada`);
  } else if (info.presupuestosAprobados > 0 && info.presupuestosFacturados === info.presupuestosAprobados) {
    expectedState = 'negocio_cerrado';
    console.log(`[businessCalculations] All approved budgets invoiced → negocio_cerrado`);
  } else if (info.presupuestosAprobados === info.totalPresupuestos) {
    expectedState = 'negocio_aceptado';
    console.log(`[businessCalculations] All budgets approved → negocio_aceptado`);
  } else if (info.presupuestosAprobados > 0 && info.presupuestosAprobados < info.totalPresupuestos) {
    expectedState = 'parcialmente_aceptado';
    console.log(`[businessCalculations] Some budgets approved (${info.presupuestosAprobados}/${info.totalPresupuestos}) → parcialmente_aceptado`);
  } else if ((info.presupuestosRechazados + info.presupuestosVencidos) === info.totalPresupuestos) {
    expectedState = 'negocio_perdido';
    console.log(`[businessCalculations] All budgets rejected/expired → negocio_perdido`);
  } else if (info.presupuestosEnviados > 0 || info.presupuestosBorrador > 0) {
    expectedState = 'presupuesto_enviado';
    console.log(`[businessCalculations] Has sent or draft budgets → presupuesto_enviado`);
  } else {
    expectedState = 'oportunidad_creada';
    console.log(`[businessCalculations] Default case → oportunidad_creada`);
  }
  
  const stateMatches = negocio.estado === expectedState;
  const hasInconsistency = !stateMatches;
  
  console.log(`[businessCalculations] State analysis result: expected "${expectedState}", actual "${negocio.estado}", matches: ${stateMatches}`);
  
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
 * Obtiene información de estado del negocio con las nuevas reglas de negocio
 */
export const obtenerEstadoNegocioInfo = (negocio: Negocio) => {
  const info = obtenerInfoPresupuestos(negocio);
  
  let descripcionEstado = '';
  let colorEstado = '';
  
  // Map legacy states to new states for consistency
  const estadoActual = mapLegacyBusinessState(negocio.estado);
  
  switch (estadoActual) {
    case 'oportunidad_creada':
      descripcionEstado = 'Oportunidad identificada, sin presupuestos creados';
      colorEstado = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case 'presupuesto_enviado':
      descripcionEstado = `${info.presupuestosEnviados} presupuesto(s) enviado(s) esperando respuesta`;
      colorEstado = 'bg-blue-100 text-blue-700 border-blue-200';
      break;
    case 'parcialmente_aceptado':
      descripcionEstado = `${info.presupuestosAprobados} de ${info.totalPresupuestos} presupuestos aprobados`;
      colorEstado = 'bg-yellow-100 text-yellow-700 border-yellow-200';
      break;
    case 'negocio_aceptado':
      descripcionEstado = 'Todos los presupuestos aprobados, pendiente facturación';
      colorEstado = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      break;
    case 'negocio_cerrado':
      descripcionEstado = 'Negocio completado y facturado';
      colorEstado = 'bg-green-100 text-green-700 border-green-200';
      break;
    case 'negocio_perdido':
      descripcionEstado = 'Presupuestos rechazados, vencidos o cancelados';
      colorEstado = 'bg-red-100 text-red-700 border-red-200';
      break;
    // Legacy states fallback (for existing data)
    case 'activo':
      descripcionEstado = 'Con presupuestos en desarrollo';
      colorEstado = 'bg-blue-100 text-blue-700 border-blue-200';
      break;
    case 'revision_pendiente':
      descripcionEstado = 'Esperando respuesta del cliente';
      colorEstado = 'bg-yellow-100 text-yellow-700 border-yellow-200';
      break;
    case 'en_negociacion':
      descripcionEstado = 'Múltiples propuestas en curso';
      colorEstado = 'bg-orange-100 text-orange-700 border-orange-200';
      break;
    default:
      descripcionEstado = estadoActual.charAt(0).toUpperCase() + estadoActual.slice(1).replace('_', ' ');
      colorEstado = 'bg-slate-100 text-slate-700 border-slate-200';
  }
  
  return {
    descripcionEstado,
    colorEstado,
    estadoNormalizado: estadoActual
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
    'negocio_perdido': 'Perdido',
    // Legacy states
    'prospecto': 'Prospecto',
    'activo': 'Activo',
    'revision_pendiente': 'En Revisión',
    'en_negociacion': 'En Negociación',
    'parcialmente_ganado': 'Parcialmente Ganado',
    'ganado': 'Ganado',
    'perdido': 'Perdido',
    'cerrado': 'Cerrado',
    'cancelado': 'Cancelado'
  };
  
  return displayNames[estado] || estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ');
};

/**
 * Obtiene estadísticas agregadas para el dashboard con nuevos estados
 */
export const obtenerEstadisticasDashboard = (negocios: Negocio[]) => {
  const totalNegocios = negocios.length;
  const valorTotalCartera = negocios.reduce((total, negocio) => total + calcularValorNegocio(negocio), 0);
  
  // Map legacy states to new states for statistics
  const negociosConEstadoNormalizado = negocios.map(negocio => ({
    ...negocio,
    estadoNormalizado: mapLegacyBusinessState(negocio.estado)
  }));
  
  const estadisticasPorEstado = {
    oportunidad_creada: negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'oportunidad_creada').length,
    presupuesto_enviado: negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'presupuesto_enviado').length,
    parcialmente_aceptado: negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'parcialmente_aceptado').length,
    negocio_aceptado: negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'negocio_aceptado').length,
    negocio_cerrado: negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'negocio_cerrado').length,
    negocio_perdido: negociosConEstadoNormalizado.filter(n => n.estadoNormalizado === 'negocio_perdido').length
  };

  const totalPresupuestos = negocios.reduce((total, negocio) => total + negocio.presupuestos.length, 0);
  
  console.log(`[businessCalculations] Dashboard statistics:`, {
    totalNegocios,
    valorTotalCartera,
    estadisticasPorEstado,
    totalPresupuestos
  });
  
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
  console.log(`[businessCalculations] Validating states for ${negocios.length} businesses...`);
  
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
  
  console.log(`[businessCalculations] Validation complete: ${inconsistencies.length} inconsistencies found, ${validStates.length} valid states`);
  
  if (inconsistencies.length > 0) {
    console.warn(`[businessCalculations] State inconsistencies found:`, inconsistencies);
  }
  
  return {
    totalBusinesses: negocios.length,
    validStates: validStates.length,
    inconsistencies: inconsistencies.length,
    inconsistentBusinesses: inconsistencies
  };
};
