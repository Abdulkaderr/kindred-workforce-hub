
-- Add start_date and end_date to locations
ALTER TABLE public.locations ADD COLUMN start_date date;
ALTER TABLE public.locations ADD COLUMN end_date date;

-- Create junction table for location-employee assignments
CREATE TABLE public.location_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, user_id)
);

ALTER TABLE public.location_employees ENABLE ROW LEVEL SECURITY;

-- Admins can manage location_employees
CREATE POLICY "Admins can manage location_employees" ON public.location_employees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view location assignments
CREATE POLICY "Authenticated users can view location_employees" ON public.location_employees
  FOR SELECT TO authenticated
  USING (true);
