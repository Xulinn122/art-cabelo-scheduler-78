-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- Create a more restrictive policy that still allows public booking
-- but validates the data properly
CREATE POLICY "Public can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_name IS NOT NULL AND 
    client_phone IS NOT NULL AND
    appointment_date >= CURRENT_DATE
  );