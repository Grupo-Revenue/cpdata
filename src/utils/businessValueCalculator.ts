
import { Negocio } from '@/types';

export const calculateBusinessValue = (negocio: Negocio): number => {
  if (!negocio.presupuestos || negocio.presupuestos.length === 0) {
    return 0;
  }

  // Calculate totals for each budget state
  const approvedTotal = negocio.presupuestos
    .filter(p => p.estado === 'aprobado')
    .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

  const rejectedTotal = negocio.presupuestos
    .filter(p => p.estado === 'rechazado')
    .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

  const sentTotal = negocio.presupuestos
    .filter(p => p.estado === 'publicado')
    .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

  console.log('📊 [Business Value Calculator] Calculating business value:', {
    negocio_id: negocio.id,
    approved_total: approvedTotal,
    rejected_total: rejectedTotal,
    sent_total: sentTotal,
    total_budgets: negocio.presupuestos.length
  });

  // UPDATED LOGIC: If there are approved budgets, use only their sum (no subtraction)
  if (approvedTotal > 0) {
    console.log('✅ [Business Value Calculator] Using approved budgets total:', {
      approved: approvedTotal,
      result: approvedTotal
    });
    return approvedTotal;
  }

  // If no approved budgets, use sent budgets
  if (sentTotal > 0) {
    console.log('📤 [Business Value Calculator] Using sent budgets total:', sentTotal);
    return sentTotal;
  }

  // If no sent budgets, use rejected budgets as fallback
  console.log('📉 [Business Value Calculator] Using rejected budgets as fallback:', rejectedTotal);
  return rejectedTotal;
};
