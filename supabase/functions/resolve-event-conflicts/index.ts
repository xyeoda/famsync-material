import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { events, resolutions } = await req.json();

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each event according to resolution
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const resolution = resolutions[i] || resolutions[i.toString()];

      try {
        if (resolution === 'skip') {
          skipped++;
          continue;
        }

        const eventData = {
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date || null,
          category: event.category,
          participants: event.participants || [],
          location: event.location || null,
          description: event.description || null,
          notes: event.notes || null,
          recurrence_slots: event.recurrence_slots || [],
          transportation: event.transportation || null,
          household_id: event.household_id,
          user_id: user.id,
        };

        if (resolution === 'update' && event.id) {
          // Update existing event
          const { error: updateError } = await supabase
            .from('family_events')
            .update(eventData)
            .eq('id', event.id);

          if (updateError) {
            console.error('Update error:', updateError);
            errors++;
          } else {
            updated++;
          }
        } else if (resolution === 'create' || !event.id) {
          // Create new event
          const { error: insertError } = await supabase
            .from('family_events')
            .insert(eventData);

          if (insertError) {
            console.error('Insert error:', insertError);
            errors++;
          } else {
            imported++;
          }
        }
      } catch (error) {
        console.error('Processing error:', error);
        errors++;
      }
    }

    // Log import action
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseAdmin.from('admin_audit_log').insert({
      performed_by: user.id,
      action_type: 'events_import',
      metadata: {
        imported,
        updated,
        skipped,
        errors,
        total: events.length,
      },
    });

    console.log(`Import complete: ${imported} imported, ${updated} updated, ${skipped} skipped, ${errors} errors`);

    return new Response(
      JSON.stringify({ imported, updated, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Resolve error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
