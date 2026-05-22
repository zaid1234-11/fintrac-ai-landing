import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // CLERK_WEBHOOK_SECRET must be added to Vercel/local .env
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or Vercel');
  }

  // Get the Svix headers from the request
  const svix_id = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Error verifying webhook signature' }, { status: 400 });
  }

  // Get event type and data
  const { id } = evt.data;
  const eventType = evt.type;
  
  // Initialize Supabase Admin Client
  const supabaseAdmin = createAdminClient();

  if (eventType === 'user.created') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : '';
    const full_name = `${first_name || ''} ${last_name || ''}`.trim();

    const { error } = await supabaseAdmin.from('users').insert({
      clerk_user_id: id,
      email: email,
      full_name: full_name,
      avatar_url: image_url,
    });

    if (error) {
       console.error("Supabase user.created insert error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : '';
    const full_name = `${first_name || ''} ${last_name || ''}`.trim();

    const { error } = await supabaseAdmin.from('users').update({
      email: email,
      full_name: full_name,
      avatar_url: image_url,
      updated_at: new Date().toISOString()
    }).eq('clerk_user_id', id);

    if (error) {
       console.error("Supabase user.updated error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { error } = await supabaseAdmin.from('users').delete().eq('clerk_user_id', id);
    if (error) {
       console.error("Supabase user.deleted error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
