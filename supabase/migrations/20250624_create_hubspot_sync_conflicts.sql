
-- Create table for storing HubSpot sync conflicts
CREATE TABLE IF NOT EXISTS public.hubspot_sync_conflicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    app_state TEXT NOT NULL,
    hubspot_state TEXT NOT NULL,
    app_amount DECIMAL(12,2),
    hubspot_amount DECIMAL(12,2),
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('state', 'amount', 'both')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    resolution_strategy TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(negocio_id, status) -- Only one pending conflict per business
);

-- Add RLS
ALTER TABLE public.hubspot_sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Create policy for conflicts
CREATE POLICY "Users can manage their own sync conflicts" ON public.hubspot_sync_conflicts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.negocios 
            WHERE negocios.id = hubspot_sync_conflicts.negocio_id 
            AND negocios.user_id = auth.uid()
        )
    );

-- Update the hubspot_sync_log table to include more detailed information
ALTER TABLE public.hubspot_sync_log 
ADD COLUMN IF NOT EXISTS sync_direction TEXT CHECK (sync_direction IN ('inbound', 'outbound', 'resolution')),
ADD COLUMN IF NOT EXISTS force_sync BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hubspot_old_stage TEXT,
ADD COLUMN IF NOT EXISTS hubspot_new_stage TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_conflicts_negocio_id ON public.hubspot_sync_conflicts(negocio_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_conflicts_status ON public.hubspot_sync_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_sync_direction ON public.hubspot_sync_log(sync_direction);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_created_at ON public.hubspot_sync_log(created_at DESC);

-- Update hubspot_sync table to track sync direction and timing
ALTER TABLE public.hubspot_sync 
ADD COLUMN IF NOT EXISTS sync_direction TEXT DEFAULT 'outbound',
ADD COLUMN IF NOT EXISTS app_last_modified TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hubspot_last_modified TIMESTAMP WITH TIME ZONE;
