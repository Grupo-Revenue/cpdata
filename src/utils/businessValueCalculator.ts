
import { Negocio } from '@/types';

export const calculateBusinessValue = (negocio: Negocio): number => {
  if (!negocio.presupuestos || negocio.presupuestos.length === 0) {
    return 0;
  }

  // Sum all approved budgets first (highest priority)
  const approvedTotal = negocio.presupuestos
    .filter(p => p.estado === 'aprobado')
    .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

  if (approvedTotal > 0) {
    return approvedTotal;
  }

  // If no approved budgets, use sent budgets
  const sentTotal = negocio.presupuestos
    .filter(p => p.estado === 'enviado')
    .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

  if (sentTotal > 0) {
    return sentTotal;
  }

  // If no sent budgets, use draft budgets
  const draftTotal = negocio.presupuestos
    .filter(p => p.estado === 'borrador')
    .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

  return draftTotal;
};
