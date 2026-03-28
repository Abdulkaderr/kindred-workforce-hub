
-- Note-employee junction table (create first so policy on notes can reference it)
CREATE TABLE public.note_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, user_id)
);

-- Notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  note_date timestamptz NOT NULL,
  note_end_date timestamptz,
  category text DEFAULT 'general',
  color text DEFAULT '#3b82f6',
  project_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK after both tables exist
ALTER TABLE public.note_employees ADD CONSTRAINT note_employees_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notes" ON public.notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view linked notes" ON public.notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.note_employees ne
      WHERE ne.note_id = id AND ne.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage note_employees" ON public.note_employees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own note_employees" ON public.note_employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
