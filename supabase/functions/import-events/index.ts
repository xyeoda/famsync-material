import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Simple fuzzy string matching using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }
  return track[str2.length][str1.length];
}

function fuzzyMatch(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLen = Math.max(str1.length, str2.length);
  return Math.round((1 - distance / maxLen) * 100);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Event {
  id?: string;
  title: string;
  start_date: string;
  end_date?: string;
  category: string;
  participants: string[];
  location?: string;
  description?: string;
  notes?: string;
  recurrence_slots: any;
  transportation?: any;
  household_id?: string;
}

function calculateMatchScore(uploaded: Event, existing: Event): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // Fuzzy title matching (40 points max)
  maxScore += 40;
  const titleScore = fuzzyMatch(uploaded.title, existing.title);
  if (titleScore > 70) {
    totalScore += (titleScore / 100) * 40;
    reasons.push(`Title similarity: ${titleScore}%`);
  }

  // Date proximity (30 points max)
  maxScore += 30;
  const uploadDate = new Date(uploaded.start_date);
  const existingDate = new Date(existing.start_date);
  const daysDiff = Math.abs((uploadDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    totalScore += 30;
    reasons.push('Same date');
  } else if (daysDiff <= 1) {
    totalScore += 20;
    reasons.push(`${daysDiff} day difference`);
  } else if (daysDiff <= 7) {
    totalScore += 10;
    reasons.push(`${Math.floor(daysDiff)} days apart`);
  }

  // Participant overlap (30 points max)
  maxScore += 30;
  const uploadedParticipants = new Set(uploaded.participants || []);
  const existingParticipants = new Set(existing.participants || []);
  const intersection = new Set([...uploadedParticipants].filter(x => existingParticipants.has(x)));
  const union = new Set([...uploadedParticipants, ...existingParticipants]);
  
  if (union.size > 0) {
    const participantScore = (intersection.size / union.size) * 30;
    totalScore += participantScore;
    if (intersection.size > 0) {
      reasons.push(`${intersection.size}/${union.size} participants match`);
    }
  }

  const finalScore = Math.round((totalScore / maxScore) * 100);
  return { score: finalScore, reasons };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Extract and verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    // Check if user is site admin or parent
    const { data: adminCheck } = await supabase.rpc('is_site_admin', { _user_id: user.id });

    const { events } = await req.json();
    if (!Array.isArray(events)) {
      throw new Error('Invalid data format: expected array of events');
    }

    // Get user's households as parent
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('household_id')
      .eq('user_id', user.id)
      .eq('role', 'parent');

    if (!adminCheck && (!userRoles || userRoles.length === 0)) {
      throw new Error('Access denied: must be site admin or parent');
    }

    if (!userRoles || userRoles.length === 0) {
      throw new Error('No households found');
    }

    const householdIds = userRoles.map(r => r.household_id);

    // Get existing events for duplicate detection
    const { data: existingEvents, error: existingError } = await supabase
      .from('family_events')
      .select('*')
      .in('household_id', householdIds);

    if (existingError) {
      throw existingError;
    }

    // Validate and check for duplicates
    const conflicts: any[] = [];
    const validEvents: Event[] = [];

    for (const event of events) {
      // Basic validation
      if (!event.title || !event.start_date || !event.category) {
        console.log('Invalid event:', event);
        continue;
      }

      // Check if household_id is valid
      if (event.household_id && !householdIds.includes(event.household_id)) {
        console.log('Invalid household_id:', event.household_id);
        continue;
      }

      // Check if event with this ID already exists
      const existsInDb = event.id && existingEvents?.some(e => e.id === event.id);
      
      if (existsInDb) {
        // Event already exists in database - treat as conflict
        const existing = existingEvents?.find(e => e.id === event.id);
        conflicts.push({
          uploadedEvent: event,
          existingEvent: existing,
          matchScore: 100,
          matchReasons: ['Exact ID match - event already exists in database'],
        });
      } else {
        // Check for fuzzy duplicates based on title, date, and participants
        let bestMatch = null;
        let bestScore = 0;

        for (const existing of existingEvents || []) {
          const { score, reasons } = calculateMatchScore(event, existing);
          
          if (score > 70 && score > bestScore) {
            bestMatch = { existing, score, reasons };
            bestScore = score;
          }
        }

        if (bestMatch) {
          conflicts.push({
            uploadedEvent: event,
            existingEvent: bestMatch.existing,
            matchScore: bestMatch.score,
            matchReasons: bestMatch.reasons,
          });
        } else {
          validEvents.push(event);
        }
      }
    }

    // Prepare summary
    const summary = {
      totalUploaded: events.length,
      conflicts: conflicts.length,
      readyToImport: validEvents.length,
      skippedInvalid: events.length - conflicts.length - validEvents.length,
    };

    // If conflicts found, return them for review
    if (conflicts.length > 0) {
      console.log(`Found ${conflicts.length} potential duplicates`);
      return new Response(
        JSON.stringify({ 
          conflicts,
          summary,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No conflicts - proceed with import
    // This will be handled by resolve-event-conflicts function
    return new Response(
      JSON.stringify({
        message: 'No conflicts found',
        summary,
        validEvents,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
