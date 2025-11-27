-- Drop the existing RLS policies for the 'e-modules' storage bucket
DROP POLICY IF EXISTS "Admins can manage e_module files" ON storage.objects;

-- Create new RLS policies for the 'e-modules' storage bucket that use the subquery method to check for admin privileges
CREATE POLICY "Admins can manage e_module files"
ON storage.objects
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  bucket_id = 'e-modules' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'e-modules' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
