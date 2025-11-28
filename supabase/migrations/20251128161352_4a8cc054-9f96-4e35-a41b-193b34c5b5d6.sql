-- Update default colors for family members to match Material Design 3 theme
-- These colors are coordinated with the UI's purple primary color scheme

ALTER TABLE public.family_settings
  ALTER COLUMN parent1_color SET DEFAULT '217, 91%, 60%',  -- Vibrant Blue
  ALTER COLUMN parent2_color SET DEFAULT '142, 71%, 45%',  -- Fresh Green
  ALTER COLUMN kid1_color SET DEFAULT '266, 100%, 60%',    -- Primary Purple
  ALTER COLUMN kid2_color SET DEFAULT '39, 100%, 50%',     -- Bright Orange
  ALTER COLUMN housekeeper_color SET DEFAULT '280, 67%, 56%'; -- Magenta Purple

-- Update existing records that still have old default colors to new theme colors
UPDATE public.family_settings
SET 
  parent1_color = CASE 
    WHEN parent1_color = '210, 40%, 50%' THEN '217, 91%, 60%'
    ELSE parent1_color
  END,
  parent2_color = CASE 
    WHEN parent2_color = '280, 40%, 50%' THEN '142, 71%, 45%'
    ELSE parent2_color
  END,
  kid1_color = CASE 
    WHEN kid1_color = '150, 40%, 50%' THEN '266, 100%, 60%'
    ELSE kid1_color
  END,
  kid2_color = CASE 
    WHEN kid2_color = '30, 40%, 50%' THEN '39, 100%, 50%'
    ELSE kid2_color
  END,
  housekeeper_color = CASE 
    WHEN housekeeper_color = '180, 30%, 50%' THEN '280, 67%, 56%'
    ELSE housekeeper_color
  END;