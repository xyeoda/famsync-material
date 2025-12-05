-- Re-run migration for events with empty participant_ids
UPDATE family_events fe
SET participant_ids = (
  SELECT COALESCE(array_agg(get_member_id_from_legacy(fe.household_id, p::text)), '{}')
  FROM unnest(fe.participants::text[]) AS p
  WHERE get_member_id_from_legacy(fe.household_id, p::text) IS NOT NULL
)
WHERE (participant_ids IS NULL OR array_length(participant_ids, 1) IS NULL OR array_length(participant_ids, 1) = 0)
  AND array_length(fe.participants::text[], 1) > 0;

-- Migrate event_instances participant_ids
UPDATE event_instances ei
SET participant_ids = (
  SELECT COALESCE(array_agg(get_member_id_from_legacy(ei.household_id, p::text)), '{}')
  FROM unnest(ei.participants::text[]) AS p
  WHERE get_member_id_from_legacy(ei.household_id, p::text) IS NOT NULL
)
WHERE (participant_ids IS NULL OR array_length(participant_ids, 1) IS NULL OR array_length(participant_ids, 1) = 0)
  AND ei.participants IS NOT NULL
  AND array_length(ei.participants::text[], 1) > 0;

-- Update transportation in recurrence_slots to add UUID fields
UPDATE family_events fe
SET recurrence_slots = (
  SELECT jsonb_agg(
    CASE 
      WHEN slot->'transportation' IS NOT NULL 
           AND slot->'transportation'->>'dropOffPerson' IS NOT NULL THEN
        jsonb_set(
          jsonb_set(
            slot,
            '{transportation,dropOffPersonId}',
            COALESCE(to_jsonb(get_member_id_from_legacy(fe.household_id, slot->'transportation'->>'dropOffPerson')::text), 'null'::jsonb)
          ),
          '{transportation,pickUpPersonId}',
          COALESCE(to_jsonb(get_member_id_from_legacy(fe.household_id, slot->'transportation'->>'pickUpPerson')::text), 'null'::jsonb)
        )
      ELSE slot
    END
  )
  FROM jsonb_array_elements(fe.recurrence_slots) AS slot
)
WHERE recurrence_slots IS NOT NULL 
  AND jsonb_array_length(recurrence_slots) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(recurrence_slots) AS s
    WHERE s->'transportation'->>'dropOffPerson' IS NOT NULL
      AND (s->'transportation'->>'dropOffPersonId' IS NULL)
  );

-- Update transportation in event_instances
UPDATE event_instances ei
SET transportation = jsonb_set(
  jsonb_set(
    transportation,
    '{dropOffPersonId}',
    COALESCE(to_jsonb(get_member_id_from_legacy(ei.household_id, transportation->>'dropOffPerson')::text), 'null'::jsonb)
  ),
  '{pickUpPersonId}',
  COALESCE(to_jsonb(get_member_id_from_legacy(ei.household_id, transportation->>'pickUpPerson')::text), 'null'::jsonb)
)
WHERE transportation IS NOT NULL
  AND transportation->>'dropOffPerson' IS NOT NULL
  AND (transportation->>'dropOffPersonId' IS NULL);