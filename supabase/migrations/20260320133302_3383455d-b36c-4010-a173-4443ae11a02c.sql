
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true);

CREATE POLICY "Anyone can view product photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-photos');

CREATE POLICY "Admins can manage product photos" ON storage.objects
  FOR ALL USING (bucket_id = 'product-photos' AND public.has_role(auth.uid(), 'admin'));
