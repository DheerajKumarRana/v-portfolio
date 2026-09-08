// Fill these in after setting up Supabase + EmailJS (see the assistant's
// setup instructions). All four values are meant to live in client-side
// code: Supabase's anon key is scoped by the row-level-security policies in
// supabase/schema.sql, and EmailJS's public key is designed to be exposed
// in frontend JS.

// Supabase — Project Settings -> API
export const SUPABASE_URL = 'https://nnlogenvvhkvlvcvgpgs.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_nxllHEJX6GYARCRX-9bfWg_MIXM0sH0';

// Email sending lives on the server (api/send-email.js) so that Gmail
// credentials never reach the browser. Its settings are environment
// variables in the Vercel project, NOT values in this file:
//   GMAIL_USER, GMAIL_APP_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

export const isConfigured = () =>
  !SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
