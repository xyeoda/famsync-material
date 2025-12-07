import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import type { Database } from '../_shared/database.types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarToken {
  id: string;
  household_id: string;
  user_id: string;
  token: string;
  filter_person: string | null;
  name: string;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Missing token parameter', { status: 400, headers: corsHeaders });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Look up the token
    const { data, error: tokenError } = await supabase
      .from('calendar_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (tokenError || !data) {
      console.error('Token lookup error:', tokenError);
      return new Response('Invalid token', { status: 404, headers: corsHeaders });
    }

    const calendarToken = data as CalendarToken;

    // Fetch family settings for legacy name resolution
    const { data: settings } = await supabase
      .from('family_settings')
      .select('*')
      .eq('household_id', calendarToken.household_id)
      .maybeSingle();

    // Fetch family members for UUID name resolution
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('*')
      .eq('household_id', calendarToken.household_id)
      .eq('is_active', true);

    // Fetch all events for this household
    const { data: events, error: eventsError } = await supabase
      .from('family_events')
      .select('*')
      .eq('household_id', calendarToken.household_id);

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
      return new Response('Error fetching events', { status: 500, headers: corsHeaders });
    }

    // Fetch all event instances for this household
    const { data: instances } = await supabase
      .from('event_instances')
      .select('*')
      .eq('household_id', calendarToken.household_id);

    // Generate iCal feed
    const icalEvents = expandEventsToICal(events || [], instances || [], calendarToken.filter_person, settings, familyMembers || []);
    
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KinSynch//Family Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarToken.name}
X-WR-TIMEZONE:UTC
${icalEvents.join('\n')}
END:VCALENDAR`;

    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${calendarToken.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
      },
    });

  } catch (error: any) {
    console.error('Calendar feed error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function expandEventsToICal(
  events: any[],
  instances: any[],
  filterPerson: string | null,
  settings: any,
  familyMembers: any[]
): string[] {
  const icalEvents: string[] = [];
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  // Helper to get member name from UUID or legacy ID
  const getMemberName = (id: string): string => {
    if (!id) return '';
    
    // Check family members first (UUID-based)
    const member = familyMembers.find(m => m.id === id);
    if (member) return member.name;
    
    // Fallback to legacy settings
    const nameKey = `${id}_name`;
    return settings?.[nameKey] || id;
  };

  events.forEach((event) => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : oneYearFromNow;

    // Iterate through each recurrence slot
    const recurrenceSlots = Array.isArray(event.recurrence_slots) ? event.recurrence_slots : [];
    
    recurrenceSlots.forEach((slot: any) => {
      let currentDate = new Date(startDate);

      // Generate occurrences for the next year or until end date
      while (currentDate <= endDate && currentDate <= oneYearFromNow) {
        // Check if this is the correct day of week
        if (currentDate.getDay() === slot.dayOfWeek) {
          const dateStr = currentDate.toISOString().split('T')[0];

          // Check for instance override
          const instance = instances.find(
            (inst) => inst.event_id === event.id && inst.date === dateStr
          );

          // Skip if cancelled
          if (instance?.cancelled) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Use instance overrides if they exist, otherwise use event defaults
          const transportation = instance?.transportation || slot.transportation || event.transportation;
          const participants = instance?.participants || event.participants;

          // Apply filter if specified - check both dropOff and pickUp person
          if (filterPerson && transportation) {
            const dropOffPerson = transportation.dropOffPerson || transportation.dropOffPersonId;
            const pickUpPerson = transportation.pickUpPerson || transportation.pickUpPersonId;
            
            if (dropOffPerson !== filterPerson && pickUpPerson !== filterPerson) {
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
          }

          // Build the iCal event
          const startTime = slot.startTime.split(':');
          const endTime = slot.endTime.split(':');
          
          const dtStart = new Date(currentDate);
          dtStart.setHours(parseInt(startTime[0]), parseInt(startTime[1]), 0);
          
          const dtEnd = new Date(currentDate);
          dtEnd.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0);

          const description = buildDescription(participants, transportation, getMemberName, event.notes);

          icalEvents.push(`BEGIN:VEVENT
UID:${event.id}-${dateStr}@kinsynch.app
DTSTART:${formatICalDate(dtStart)}
DTEND:${formatICalDate(dtEnd)}
SUMMARY:${escapeICalText(event.title)}
DESCRIPTION:${escapeICalText(description)}
LOCATION:${escapeICalText(event.location || '')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT`);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  });

  return icalEvents;
}

function buildDescription(
  participants: string[], 
  transportation: any, 
  getMemberName: (id: string) => string,
  notes?: string
): string {
  let desc = '';

  // Add participants
  if (participants && participants.length > 0) {
    const participantNames = participants.map(p => getMemberName(p));
    desc += `Participants: ${participantNames.join(', ')}\n`;
  }

  // Add transportation
  if (transportation) {
    const dropOffPerson = transportation.dropOffPersonId || transportation.dropOffPerson;
    const pickUpPerson = transportation.pickUpPersonId || transportation.pickUpPerson;
    
    if (dropOffPerson && transportation.dropOffMethod) {
      desc += `Drop-off: ${getMemberName(dropOffPerson)} (${transportation.dropOffMethod})\n`;
    }
    if (pickUpPerson && transportation.pickUpMethod) {
      desc += `Pick-up: ${getMemberName(pickUpPerson)} (${transportation.pickUpMethod})\n`;
    }
  }

  // Add notes
  if (notes) {
    desc += `\nNotes: ${notes}`;
  }

  return desc;
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}