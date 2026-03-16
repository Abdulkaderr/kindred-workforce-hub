
-- 1. Fix: Employees can modify their own hourly_rate (privilege escalation)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own non-sensitive profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.prevent_employee_hourly_rate_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.hourly_rate IS DISTINCT FROM NEW.hourly_rate THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.hourly_rate := OLD.hourly_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_hourly_rate_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_employee_hourly_rate_change();

-- 2. Fix: Employees can backdate attendance records
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance_records;

CREATE POLICY "Users can insert own attendance for today"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND date = CURRENT_DATE
);

DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance_records;

CREATE POLICY "Users can update own attendance for today"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND date = CURRENT_DATE);
