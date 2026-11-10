import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('You must be signed in.');

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) throw new Error('You must be signed in.');

    const { data: callerRow, error: roleError } = await callerClient
      .from('users').select('role').eq('id', caller.id).single();
    if (roleError || !['spl', 'aspl'].includes(callerRow?.role)) {
      return new Response(JSON.stringify({ error: 'Only SPL and ASPL users can create accounts.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, role = 'scout' } = await request.json();
    if (!email || !password || !['scout', 'spl', 'aspl'].includes(role)) {
      throw new Error('A valid email, password, and role are required.');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: false, user_metadata: { role },
    });
    if (createError || !created.user) throw createError || new Error('Account creation failed.');

    const { error: profileError } = await adminClient.from('users').insert({
      id: created.user.id, role,
    });
    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      throw profileError;
    }

    return new Response(JSON.stringify({ success: true, user_id: created.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
