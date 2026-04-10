-- Allow admins to delete correction_requests
CREATE POLICY "Admins can delete requests"
  ON public.correction_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));