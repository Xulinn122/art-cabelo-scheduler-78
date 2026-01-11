-- Create barbers table
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active barbers
CREATE POLICY "Anyone can view active barbers"
ON public.barbers
FOR SELECT
USING (is_active = true);

-- Admins can manage barbers
CREATE POLICY "Admins can manage barbers"
ON public.barbers
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create barber_schedules table
CREATE TABLE public.barber_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '19:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (barber_id, day_of_week)
);

-- Enable RLS on barber_schedules
ALTER TABLE public.barber_schedules ENABLE ROW LEVEL SECURITY;

-- Anyone can view schedules
CREATE POLICY "Anyone can view barber schedules"
ON public.barber_schedules
FOR SELECT
USING (true);

-- Admins can manage schedules
CREATE POLICY "Admins can manage barber schedules"
ON public.barber_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add barber_id to appointments
ALTER TABLE public.appointments 
ADD COLUMN barber_id UUID REFERENCES public.barbers(id);

-- Create storage bucket for barber photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('barber-photos', 'barber-photos', true);

-- Storage policies for barber photos
CREATE POLICY "Barber photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'barber-photos');

CREATE POLICY "Admins can upload barber photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'barber-photos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update barber photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'barber-photos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete barber photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'barber-photos' AND has_role(auth.uid(), 'admin'));

-- Function to create default schedule for a new barber
CREATE OR REPLACE FUNCTION public.create_default_barber_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create schedule for Monday to Saturday (1-6), Sunday off
  INSERT INTO public.barber_schedules (barber_id, day_of_week, start_time, end_time, is_active)
  VALUES
    (NEW.id, 1, '09:00', '19:00', true),  -- Monday
    (NEW.id, 2, '09:00', '19:00', true),  -- Tuesday
    (NEW.id, 3, '09:00', '19:00', true),  -- Wednesday
    (NEW.id, 4, '09:00', '19:00', true),  -- Thursday
    (NEW.id, 5, '09:00', '19:00', true),  -- Friday
    (NEW.id, 6, '09:00', '18:00', true),  -- Saturday
    (NEW.id, 0, '00:00', '00:00', false); -- Sunday (off)
  RETURN NEW;
END;
$$;

-- Trigger to auto-create schedule when barber is added
CREATE TRIGGER on_barber_created
  AFTER INSERT ON public.barbers
  FOR EACH ROW EXECUTE FUNCTION public.create_default_barber_schedule();