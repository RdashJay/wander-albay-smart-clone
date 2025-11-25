-- Add detailed user profile fields
ALTER TABLE public.profiles
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN middle_initial TEXT CHECK (length(middle_initial) <= 1),
ADD COLUMN suffix TEXT CHECK (suffix IN ('Jr.', 'Sr.', 'II', 'III', 'IV'));

-- Update the handle_new_user function to use new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    middle_initial, 
    suffix,
    full_name
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'middle_initial',
    new.raw_user_meta_data->>'suffix',
    new.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;