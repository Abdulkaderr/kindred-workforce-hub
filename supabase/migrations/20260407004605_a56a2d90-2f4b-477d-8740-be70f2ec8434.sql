
CREATE TABLE public.project_revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage project_revenues"
  ON public.project_revenues
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view project_revenues"
  ON public.project_revenues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_project_revenues_updated_at
  BEFORE UPDATE ON public.project_revenues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
