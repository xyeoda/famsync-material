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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is site admin or parent
    const { data: adminCheck } = await supabase.rpc('is_site_admin', { _user_id: user.id });
    
    // Get all households user has access to as parent
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

    // Export all events from these households
    const { data: events, error: eventsError } = await supabase
      .from('family_events')
      .select('*')
      .in('household_id', householdIds)
      .order('start_date', { ascending: true });

    if (eventsError) {
      throw eventsError;
    }

    // Export event instances
    const { data: instances, error: instancesError } = await supabase
      .from('event_instances')
      .select('*')
      .in('household_id', householdIds)
      .order('date', { ascending: true });

    if (instancesError) {
      throw instancesError;
    }

    // Log export action
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseAdmin.from('admin_audit_log').insert({
      performed_by: user.id,
      action_type: 'events_export',
      metadata: {
        event_count: events?.length || 0,
        instance_count: instances?.length || 0,
        household_ids: householdIds,
      },
    });

    console.log(`Exported ${events?.length || 0} events and ${instances?.length || 0} instances`);

    return new Response(
      JSON.stringify({
        events: events || [],
        instances: instances || [],
        exported_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
