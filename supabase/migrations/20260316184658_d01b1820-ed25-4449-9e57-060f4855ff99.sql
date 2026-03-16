
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time timestamptz,
  check_out_time timestamptz,
  break_duration_ms bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'checked_in',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Employees can view their own records
CREATE POLICY "Users can view own attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Employees can insert their own records
CREATE POLICY "Users can insert own attendance"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Employees can update their own records
CREATE POLICY "Users can update own attendance"
  ON public.attendance_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all records
CREATE POLICY "Admins can view all attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all records
CREATE POLICY "Admins can update all attendance"
  ON public.attendance_records FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
