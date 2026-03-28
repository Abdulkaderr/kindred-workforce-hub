
-- Function to recalculate payroll for a given user based on attendance
CREATE OR REPLACE FUNCTION public.recalculate_payroll_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_user_id uuid;
  affected_date date;
  pr RECORD;
BEGIN
  -- Determine affected user and date
  IF TG_OP = 'DELETE' THEN
    affected_user_id := OLD.user_id;
    affected_date := OLD.date;
  ELSE
    affected_user_id := NEW.user_id;
    affected_date := NEW.date;
  END IF;

  -- Find all payroll records whose period covers the affected date
  FOR pr IN
    SELECT id, period_start, period_end, paid_amount
    FROM public.payroll_records
    WHERE user_id = affected_user_id
      AND period_start <= affected_date
      AND period_end >= affected_date
  LOOP
    -- Recalculate total hours from attendance in that period
    DECLARE
      new_total_hours numeric;
      emp_rate numeric;
      new_total_salary numeric;
      new_remaining numeric;
      new_status text;
    BEGIN
      SELECT COALESCE(SUM(
        GREATEST(0,
          (EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) - COALESCE(a.break_duration_ms, 0) / 1000.0) / 3600.0
        )
      ), 0)
      INTO new_total_hours
      FROM public.attendance_records a
      WHERE a.user_id = affected_user_id
        AND a.date >= pr.period_start
        AND a.date <= pr.period_end
        AND a.check_in_time IS NOT NULL
        AND a.check_out_time IS NOT NULL;

      new_total_hours := ROUND(new_total_hours::numeric, 1);

      SELECT COALESCE(hourly_rate, 0) INTO emp_rate
      FROM public.profiles
      WHERE profiles.user_id = affected_user_id
      LIMIT 1;

      new_total_salary := ROUND(new_total_hours * emp_rate, 2);
      new_remaining := GREATEST(0, new_total_salary - COALESCE(pr.paid_amount, 0));

      IF new_remaining <= 0 AND new_total_salary > 0 THEN
        new_status := 'paid';
      ELSIF COALESCE(pr.paid_amount, 0) > 0 THEN
        new_status := 'partial';
      ELSE
        new_status := 'pending';
      END IF;

      UPDATE public.payroll_records
      SET total_hours = new_total_hours,
          hourly_rate = emp_rate,
          total_salary = new_total_salary,
          status = new_status
      WHERE id = pr.id;
    END;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on attendance_records
CREATE TRIGGER trg_recalculate_payroll
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_payroll_for_user();
