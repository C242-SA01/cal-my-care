CREATE POLICY "Admins can update screenings" 
ON public.screenings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id::text = auth.uid()::text -- WORKAROUND: Temporarily allowing any authenticated user as 'role' column is missing.
  )
);
