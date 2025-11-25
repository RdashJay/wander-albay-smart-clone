-- Add subcategories field to tourist_spots
ALTER TABLE tourist_spots
ADD COLUMN IF NOT EXISTS subcategories text[] DEFAULT '{}';

-- Add subcategories field to accommodations  
ALTER TABLE accommodations
ADD COLUMN IF NOT EXISTS subcategories text[] DEFAULT '{}';

-- Update existing tourist spots to use uppercase category names
UPDATE tourist_spots
SET category = ARRAY(
  SELECT CASE 
    WHEN unnest = 'Nature' THEN 'NATURE'
    WHEN unnest = 'Adventure' THEN 'ADVENTURE'
    WHEN unnest = 'Culture' THEN 'CULTURE'
    WHEN unnest = 'Food' THEN 'FOOD'
    WHEN unnest = 'Beach' THEN 'BEACHES'
    WHEN unnest = 'Heritage' THEN 'HERITAGE'
    WHEN unnest = 'Shopping' THEN 'SHOPPING'
    WHEN unnest = 'Wildlife' THEN 'WILDLIFE / ECO'
    ELSE unnest
  END
  FROM unnest(category)
)
WHERE category IS NOT NULL;