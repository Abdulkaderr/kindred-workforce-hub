
-- 1. Fix user_roles: drop the ALL policy for admins (it includes INSERT without restriction)
-- and recreate separate policies that are properly scoped
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Admins can do everything on user_roles
CREATE POLICY "Admins can select roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix profiles: restrict employees from updating hourly_rate
-- Drop the permissive employee update policy and replace with column-restricted approach
DROP POLICY IF EXISTS "Users can update own non-sensitive profile fields" ON public.profiles;

-- Revoke blanket UPDATE, then grant only safe columns
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, email, updated_at) ON public.profiles TO authenticated;

-- Re-add the policy (it still controls row-level access)
CREATE POLICY "Users can update own profile safe fields"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Fix broken notes RLS policy
DROP POLICY IF EXISTS "Employees can view linked notes" ON public.notes;

CREATE POLICY "Employees can view linked notes"
  ON public.notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.note_employees ne
      WHERE ne.note_id = notes.id AND ne.user_id = auth.uid()
    )
  );
