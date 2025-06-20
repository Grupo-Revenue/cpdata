
import { Negocio } from '@/types';

/**
 * Calcula el valor total del negocio sumando todos los presupuestos
 */
export const calcularValorNegocio = (negocio: Negocio): number => {
  return negocio.presupuestos.reduce((total, presupuesto) => total + presupuesto.total, 0);
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
  
  return {
    totalPresupuestos,
    presupuestosAprobados,
    presupuestosEnviados,
    presupuestosBorrador,
    presupuestosRechazados,
    presupuestosVencidos
  };
};

/**
 * Obtiene información de estado del negocio basado en los presupuestos
 */
export const obtenerEstadoNegocioInfo = (negocio: Negocio) => {
  const info = obtenerInfoPresupuestos(negocio);
  
  let descripcionEstado = '';
  let colorEstado = '';
  
  switch (negocio.estado) {
    case 'prospecto':
      descripcionEstado = 'Sin presupuestos creados';
      colorEstado = 'bg-gray-100 text-gray-700 border-gray-200';
      break;
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
    case 'parcialmente_ganado':
      descripcionEstado = `${info.presupuestosAprobados} de ${info.totalPresupuestos} presupuestos aprobados`;
      colorEstado = 'bg-emerald-100 text-emerald-700 border-emerald-200';
      break;
    case 'ganado':
      descripcionEstado = 'Todos los presupuestos aprobados';
      colorEstado = 'bg-green-100 text-green-700 border-green-200';
      break;
    case 'perdido':
      descripcionEstado = 'Presupuestos rechazados o vencidos';
      colorEstado = 'bg-red-100 text-red-700 border-red-200';
      break;
    default:
      descripcionEstado = negocio.estado.charAt(0).toUpperCase() + negocio.estado.slice(1);
      colorEstado = 'bg-slate-100 text-slate-700 border-slate-200';
  }
  
  return {
    descripcionEstado,
    colorEstado
  };
};
