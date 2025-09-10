-- Fix RLS issues for existing tables that don't have RLS enabled
ALTER TABLE public.bazar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bazar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for existing tables
CREATE POLICY "Allow public read access to menus" 
ON public.menus 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to view events" 
ON public.bazar_events 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to register for events" 
ON public.bazar_registrations 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to manage their own complaints" 
ON public.complaints 
FOR ALL 
USING (auth.uid() = created_by);

CREATE POLICY "Allow public read access to complaints" 
ON public.complaints 
FOR SELECT 
USING (true);

CREATE POLICY "Allow users to manage complaint comments" 
ON public.complaint_comments 
FOR ALL 
USING (auth.uid() = created_by);

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'email'
    );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;