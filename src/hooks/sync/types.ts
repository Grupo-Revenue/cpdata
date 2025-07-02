
export interface SyncConflict {
  id: string;
  negocio_id: string;
  conflict_type: 'state' | 'amount' | 'both';
  app_state: string;
  hubspot_state: string;
  app_amount: number;
  hubspot_amount: number;
  status: string;
  created_at: string;
}

export interface SyncStats {
  total_pending: number;
  total_processing: number;
  total_failed: number;
  total_completed_today: number;
  avg_processing_time_minutes: number;
}
