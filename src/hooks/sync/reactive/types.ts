
export interface SyncQueueItem {
  id: string;
  negocio_id: string;
  operation_type: string;
  priority: number;
  status: string;
  attempts: number;
  created_at: string;
  error_message?: string;
}

export interface SyncStats {
  total_pending: number;
  total_processing: number;
  total_failed: number;
  total_completed_today: number;
  avg_processing_time_minutes: number;
}
