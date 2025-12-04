-- Phase 2: Migrate event system to use UUID references for family_members

-- Step 1: Seed family_members from existing family_settings
-- Insert parents
INSERT INTO family_members (household_id, name, color, member_type, display_order, is_active)
SELECT 
  fs.household_id,
  COALESCE(fs.parent1_name, 'Parent 1'),
  COALESCE(fs.parent1_color, '217 91% 60%'),
  'parent'::member_type,
  0,
  true
FROM family_settings fs
WHERE fs.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.household_id = fs.household_id 
    AND fm.member_type = 'parent' 
    AND fm.display_order = 0
  );

INSERT INTO family_members (household_id, name, color, member_type, display_order, is_active)
SELECT 
  fs.household_id,
  COALESCE(fs.parent2_name, 'Parent 2'),
  COALESCE(fs.parent2_color, '142 71% 45%'),
  'parent'::member_type,
  1,
  true
FROM family_settings fs
WHERE fs.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.household_id = fs.household_id 
    AND fm.member_type = 'parent' 
    AND fm.display_order = 1
  );

-- Insert kids
INSERT INTO family_members (household_id, name, color, member_type, display_order, is_active)
SELECT 
  fs.household_id,
  COALESCE(fs.kid1_name, 'Kid 1'),
  COALESCE(fs.kid1_color, '266 100% 60%'),
  'kid'::member_type,
  0,
  true
FROM family_settings fs
WHERE fs.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.household_id = fs.household_id 
    AND fm.member_type = 'kid' 
    AND fm.display_order = 0
  );

INSERT INTO family_members (household_id, name, color, member_type, display_order, is_active)
SELECT 
  fs.household_id,
  COALESCE(fs.kid2_name, 'Kid 2'),
  COALESCE(fs.kid2_color, '39 100% 50%'),
  'kid'::member_type,
  1,
  true
FROM family_settings fs
WHERE fs.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.household_id = fs.household_id 
    AND fm.member_type = 'kid' 
    AND fm.display_order = 1
  );

-- Insert helper (housekeeper)
INSERT INTO family_members (household_id, name, color, member_type, helper_category, display_order, is_active)
SELECT 
  fs.household_id,
  COALESCE(fs.housekeeper_name, 'Housekeeper'),
  COALESCE(fs.housekeeper_color, '280 67% 56%'),
  'helper'::member_type,
  'housekeeper'::helper_category,
  0,
  true
FROM family_settings fs
WHERE fs.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.household_id = fs.household_id 
    AND fm.member_type = 'helper' 
    AND fm.display_order = 0
  );

-- Step 2: Add new UUID array columns
ALTER TABLE family_events 
ADD COLUMN IF NOT EXISTS participant_ids uuid[] DEFAULT '{}';

ALTER TABLE event_instances 
ADD COLUMN IF NOT EXISTS participant_ids uuid[] DEFAULT '{}';

-- Step 3: Create helper function to convert legacy ID to UUID
CREATE OR REPLACE FUNCTION get_member_id_from_legacy(
  p_household_id uuid,
  p_legacy_id text
) RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_type member_type;
  v_display_order int;
  v_result uuid;
BEGIN
  IF p_legacy_id IS NULL OR p_household_id IS NULL THEN
    RETURN NULL;
  END IF;

  CASE p_legacy_id
    WHEN 'parent1' THEN v_member_type := 'parent'; v_display_order := 0;
    WHEN 'parent2' THEN v_member_type := 'parent'; v_display_order := 1;
    WHEN 'kid1' THEN v_member_type := 'kid'; v_display_order := 0;
    WHEN 'kid2' THEN v_member_type := 'kid'; v_display_order := 1;
    WHEN 'housekeeper' THEN v_member_type := 'helper'; v_display_order := 0;
    ELSE RETURN NULL;
  END CASE;
  
  SELECT id INTO v_result
  FROM family_members
  WHERE household_id = p_household_id
    AND member_type = v_member_type
    AND display_order = v_display_order
    AND is_active = true
  LIMIT 1;
  
  RETURN v_result;
END;
$$;

-- Step 4: Migrate existing event participants to UUIDs
UPDATE family_events fe
SET participant_ids = (
  SELECT COALESCE(
    array_agg(get_member_id_from_legacy(fe.household_id, p::text)) FILTER (WHERE get_member_id_from_legacy(fe.household_id, p::text) IS NOT NULL),
    '{}'
  )
  FROM unnest(fe.participants::text[]) AS p
)
WHERE fe.household_id IS NOT NULL;

-- Step 5: Migrate event_instances participants
UPDATE event_instances ei
SET participant_ids = (
  SELECT COALESCE(
    array_agg(get_member_id_from_legacy(ei.household_id, p::text)) FILTER (WHERE get_member_id_from_legacy(ei.household_id, p::text) IS NOT NULL),
    '{}'
  )
  FROM unnest(ei.participants::text[]) AS p
)
WHERE ei.household_id IS NOT NULL AND ei.participants IS NOT NULL;