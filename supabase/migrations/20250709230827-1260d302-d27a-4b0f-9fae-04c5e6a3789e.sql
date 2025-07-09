-- Add productos_presupuesto to realtime publication for complete value sync
DO $$
BEGIN
    -- Check if productos_presupuesto is in the publication
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'productos_presupuesto'
    ) THEN
        -- Add productos_presupuesto to realtime publication
        ALTER PUBLICATION supabase_realtime ADD TABLE productos_presupuesto;
        RAISE NOTICE 'Added productos_presupuesto table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'productos_presupuesto table is already in supabase_realtime publication';
    END IF;
END $$;