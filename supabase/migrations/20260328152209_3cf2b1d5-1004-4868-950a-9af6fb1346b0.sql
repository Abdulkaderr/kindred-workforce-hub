
-- Clear existing project_id references in notes that point to locations
UPDATE public.notes SET project_id = NULL WHERE project_id IS NOT NULL;

-- Drop old FK
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_project_id_fkey;

-- Create projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL UNIQUE,
  total_amount numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage projects" ON public.projects
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view projects" ON public.projects
  FOR SELECT TO authenticated
  USING (true);

-- Create project_employees junction
CREATE TABLE public.project_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage project_employees" ON public.project_employees
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view project_employees" ON public.project_employees
  FOR SELECT TO authenticated
  USING (true);

-- Add project_id to attendance_records
ALTER TABLE public.attendance_records ADD COLUMN project_id uuid REFERENCES public.projects(id);

-- Add new FK on notes to projects
ALTER TABLE public.notes ADD CONSTRAINT notes_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- Updated_at trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
