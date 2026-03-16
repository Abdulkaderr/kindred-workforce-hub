
-- Revert attendance INSERT policy to allow any date
DROP POLICY IF EXISTS "Users can insert own attendance for today" ON public.attendance_records;

CREATE POLICY "Users can insert own attendance"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Revert attendance UPDATE policy to allow any date
DROP POLICY IF EXISTS "Users can update own attendance for today" ON public.attendance_records;

CREATE POLICY "Users can update own attendance"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
