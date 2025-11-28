import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid invitation token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify invitation exists and is not expired
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('pending_invitations')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (inviteError || !invitation) {
      console.error('Invalid or expired invitation:', inviteError);
      const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com');
      return Response.redirect(`${siteUrl}/auth?error=invalid_invitation`, 302);
    }

    const { email, household_id, role, is_first_parent } = invitation;
    console.log(`Processing magic invite for ${email} to household ${household_id}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      // User exists, use their ID
      userId = existingUser.id;
      console.log(`User already exists: ${userId}`);
    } else {
      // Create new user with temporary secure password
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          invited_to_household: household_id,
          invited_role: role
        }
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        throw new Error('Failed to create user account');
      }

      userId = newUser.user.id;
      console.log(`Created new user: ${userId}`);
    }

    // Generate magic link for auto sign-in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
    });

    if (linkError || !linkData) {
      console.error('Error generating magic link:', linkError);
      throw new Error('Failed to generate sign-in link');
    }

    // Check if user already has role in this household
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('household_id', household_id)
      .maybeSingle();

    if (!existingRole) {
      // Assign role to household
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          household_id: household_id,
          role: role
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        throw new Error('Failed to assign household role');
      }
      console.log(`Assigned role ${role} to user in household ${household_id}`);
    }

    // If first parent, set as household owner and create family settings
    if (is_first_parent) {
      const { error: ownerError } = await supabaseAdmin
        .from('households')
        .update({ owner_id: userId })
        .eq('id', household_id);

      if (ownerError) {
        console.error('Error setting household owner:', ownerError);
      } else {
        console.log(`Set user ${userId} as owner of household ${household_id}`);
      }

      // Check if family settings exist
      const { data: existingSettings } = await supabaseAdmin
        .from('family_settings')
        .select('id')
        .eq('household_id', household_id)
        .maybeSingle();

      if (!existingSettings) {
        const { error: settingsError } = await supabaseAdmin
          .from('family_settings')
          .insert({
            user_id: userId,
            household_id: household_id
          });

        if (settingsError) {
          console.error('Error creating family settings:', settingsError);
        } else {
          console.log(`Created family settings for household ${household_id}`);
        }
      }
    }

    // Mark user as needing password change
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Delete the invitation
    const { error: deleteError } = await supabaseAdmin
      .from('pending_invitations')
      .delete()
      .eq('token', token);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
    }

    console.log(`Magic invite processed successfully for ${email}`);

    // Redirect to auth callback with the magic link hash
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com');
    const redirectUrl = `${siteUrl}/auth/callback${linkData.properties.hashed_token}`;
    
    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error('Error in magic-invite:', error);
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com');
    return Response.redirect(`${siteUrl}/auth?error=invitation_failed`, 302);
  }
});
