
-- Create storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true);

-- Create RLS policies for the brand-assets bucket
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'brand-assets');

CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" ON storage.objects
FOR UPDATE USING (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" ON storage.objects
FOR DELETE USING (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');
