-- Add new fields to tourist_spots for better filtering
ALTER TABLE public.tourist_spots 
ADD COLUMN IF NOT EXISTS budget_level text CHECK (budget_level IN ('budget', 'moderate', 'premium')),
ADD COLUMN IF NOT EXISTS accessibility_friendly boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scenery_type text[] DEFAULT '{}';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tourist_spots_budget ON public.tourist_spots(budget_level);
CREATE INDEX IF NOT EXISTS idx_tourist_spots_accessibility ON public.tourist_spots(accessibility_friendly);
CREATE INDEX IF NOT EXISTS idx_tourist_spots_scenery ON public.tourist_spots USING GIN(scenery_type);

-- Update existing spots with default scenery based on categories
UPDATE public.tourist_spots 
SET scenery_type = ARRAY['mountain']
WHERE 'Nature' = ANY(category) OR 'Adventure' = ANY(category);

UPDATE public.tourist_spots 
SET scenery_type = ARRAY['beach']
WHERE 'Beach' = ANY(category);

UPDATE public.tourist_spots 
SET scenery_type = ARRAY['waterfall']
WHERE name ILIKE '%falls%' OR name ILIKE '%waterfall%';

UPDATE public.tourist_spots 
SET scenery_type = ARRAY['urban']
WHERE 'Cultural' = ANY(category) OR 'Historical' = ANY(category);

-- Set default budget levels
UPDATE public.tourist_spots 
SET budget_level = 'budget'
WHERE budget_level IS NULL;

COMMENT ON COLUMN public.tourist_spots.budget_level IS 'Budget category: budget, moderate, or premium';
COMMENT ON COLUMN public.tourist_spots.accessibility_friendly IS 'Whether the location is accessibility-friendly';
COMMENT ON COLUMN public.tourist_spots.scenery_type IS 'Types of scenery available: mountain, beach, waterfall, urban, rural';