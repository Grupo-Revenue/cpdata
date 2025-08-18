-- Configurar la variable de entorno necesaria para la autenticación de triggers
-- Esta variable permite a los triggers autenticarse correctamente al llamar edge functions
SELECT set_config('app.supabase_service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnR1dXZpZ2NxcGlicGZjeGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODQzMSwiZXhwIjoyMDY1OTU0NDMxfQ.GhubhZfpe7PpQVlBK9FJLMTpGW5ilPumRPRn0jn4bSY', false);

-- Verificar que la variable se configuró correctamente
SELECT current_setting('app.supabase_service_role_key', true) as service_role_key_configured;