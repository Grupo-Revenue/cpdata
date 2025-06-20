
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
  
  return {
    totalPresupuestos,
    presupuestosAprobados,
    presupuestosEnviados,
    presupuestosBorrador
  };
};
