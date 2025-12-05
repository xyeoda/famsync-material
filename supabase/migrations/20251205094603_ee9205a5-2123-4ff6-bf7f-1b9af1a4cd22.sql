-- Final cleanup: Drop legacy enum columns and rename UUID columns

-- First, drop the legacy participants column from family_events
ALTER TABLE family_events DROP COLUMN IF EXISTS participants;

-- Rename participant_ids to participants
ALTER TABLE family_events RENAME COLUMN participant_ids TO participants;

-- Same for event_instances
ALTER TABLE event_instances DROP COLUMN IF EXISTS participants;
ALTER TABLE event_instances RENAME COLUMN participant_ids TO participants;