-- Create settings table for business configuration
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (public info)
CREATE POLICY "Anyone can view settings"
ON public.settings
FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value, label, category) VALUES
  ('phone', '47 9961-3570', 'Telefone', 'contact'),
  ('whatsapp', '5547996135570', 'WhatsApp (apenas números)', 'contact'),
  ('address', 'R Monsenhor Gercino 5207 - Jarivatuba', 'Endereço', 'contact'),
  ('city', 'Joinville, SC', 'Cidade', 'contact'),
  ('instagram', 'BARBEARIA.ARTCABELO', 'Instagram', 'social'),
  ('facebook', '', 'Facebook', 'social'),
  ('hours_weekday', '09:00 - 19:00', 'Horário Seg-Sex', 'hours'),
  ('hours_saturday', '09:00 - 18:00', 'Horário Sábado', 'hours'),
  ('hours_sunday', 'Fechado', 'Horário Domingo', 'hours');