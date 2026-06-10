// Secure admin data endpoint.
// The browser never sees the database key. The admin page POSTs the password here;
// we verify it against ADMIN_PASSWORD, then use the secret service-role key
// (which bypasses RLS) to read/update bookings server-side.
//
// Required Vercel environment variables:
//   ADMIN_PASSWORD              — the admin dashboard password
//   SUPABASE_SERVICE_ROLE_KEY   — Supabase → Project Settings → API → service_role (secret)

const SUPABASE_URL = "https://okogabnckgvxlruhmniu.supabase.co";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password, action, id } = req.body || {};

  // Auth gate — wrong/missing password gets nothing.
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
  }
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': 'Bearer ' + SERVICE_KEY
  };

  try {
    if (action === 'markDone') {
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad id' });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'done' })
      });
      if (!r.ok) return res.status(502).json({ error: 'update failed' });
      return res.status(200).json({ ok: true });
    }

    // default action: list all bookings, newest first
    const r = await fetch(`${SUPABASE_URL}/rest/v1/bookings?order=id.desc`, { headers });
    if (!r.ok) return res.status(502).json({ error: 'read failed' });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
}
