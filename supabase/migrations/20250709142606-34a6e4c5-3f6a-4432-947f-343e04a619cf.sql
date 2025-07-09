-- Enable realtime for negocios table
ALTER TABLE public.negocios REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.negocios;