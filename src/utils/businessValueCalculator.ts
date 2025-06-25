
import { Negocio } from '@/types';

export const calculateBusinessValue = (negocio: Negocio): number => {
  if (!negocio.presupuestos || negocio.presupuestos.length === 0) {
    return 0;
  }

  // Sum all approved budgets
  const approvedTotal = negocio.presupuestos
    .filter(p => p.estado === 'aprobado')
    .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

  // If no approved budgets, use sent budgets
  if (approvedTotal === 0) {
    return negocio.presupuestos
      .filter(p => p.estado === 'enviado')
      .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);
  }

  return approvedTotal;
};
