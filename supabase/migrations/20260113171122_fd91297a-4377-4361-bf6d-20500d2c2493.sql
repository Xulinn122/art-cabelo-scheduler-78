-- Add break/pause time columns to barber_schedules
ALTER TABLE public.barber_schedules 
ADD COLUMN break_start TIME WITHOUT TIME ZONE DEFAULT NULL,
ADD COLUMN break_end TIME WITHOUT TIME ZONE DEFAULT NULL;