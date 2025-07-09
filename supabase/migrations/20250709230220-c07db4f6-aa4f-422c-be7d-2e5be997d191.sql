-- Verificar y agregar tabla presupuestos a realtime si no está
DO $$
BEGIN
    -- Check if presupuestos is in the publication
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'presupuestos'
    ) THEN
        -- Add presupuestos to realtime publication
        ALTER PUBLICATION supabase_realtime ADD TABLE presupuestos;
        RAISE NOTICE 'Added presupuestos table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'presupuestos table is already in supabase_realtime publication';
    END IF;
END $$;