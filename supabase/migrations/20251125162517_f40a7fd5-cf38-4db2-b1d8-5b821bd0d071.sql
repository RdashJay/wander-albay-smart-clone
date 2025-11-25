-- Fix tourist_spots table structure to use proper foreign keys
-- First, add new columns for foreign key references
ALTER TABLE public.tourist_spots 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tourist_spots_category_id ON public.tourist_spots(category_id);
CREATE INDEX IF NOT EXISTS idx_tourist_spots_subcategory_id ON public.tourist_spots(subcategory_id);

-- Add unique constraint to category names
ALTER TABLE public.categories 
ADD CONSTRAINT unique_category_name UNIQUE (name);

-- Add unique constraint to subcategory names within a category
ALTER TABLE public.subcategories 
ADD CONSTRAINT unique_subcategory_per_category UNIQUE (category_id, name);

-- Add cascade delete for subcategories when category is deleted
ALTER TABLE public.subcategories 
DROP CONSTRAINT IF EXISTS subcategories_category_id_fkey,
ADD CONSTRAINT subcategories_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES public.categories(id) 
  ON DELETE CASCADE;

-- Update accommodations table similarly
ALTER TABLE public.accommodations 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accommodations_category_id ON public.accommodations(category_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_subcategory_id ON public.accommodations(subcategory_id);

-- Create function to prevent category deletion if it has spots
CREATE OR REPLACE FUNCTION public.check_category_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tourist_spots WHERE category_id = OLD.id
  ) OR EXISTS (
    SELECT 1 FROM public.accommodations WHERE category_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete category: it is currently assigned to spots or accommodations';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_category_deletion
  BEFORE DELETE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.check_category_usage();

-- Create function to prevent subcategory deletion if it has spots
CREATE OR REPLACE FUNCTION public.check_subcategory_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tourist_spots WHERE subcategory_id = OLD.id
  ) OR EXISTS (
    SELECT 1 FROM public.accommodations WHERE subcategory_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete subcategory: it is currently assigned to spots or accommodations';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_subcategory_deletion
  BEFORE DELETE ON public.subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.check_subcategory_usage();