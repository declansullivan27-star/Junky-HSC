import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const b = req.body || {};

  // Recipients come from CREW_EMAILS (comma-separated). Trim spaces, drop blanks.
  const to = (process.env.CREW_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  // From-address must be on a domain verified in Resend to reach anyone but
  // your own account. Falls back to Resend's shared sender only if unset.
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

  if (!process.env.RESEND_API_KEY) {
    console.error('notify-crew: RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'email not configured' });
  }
  if (!to.length) {
    console.error('notify-crew: CREW_EMAILS is not set');
    return res.status(500).json({ ok: false, error: 'no recipients configured' });
  }

  // Optional photos: the booking page resizes images client-side and sends them
  // as base64. Cap the count/size defensively so we never build a huge email.
  const photos = Array.isArray(b.photos) ? b.photos.slice(0, 6) : [];
  const attachments = photos
    .filter(p => p && p.content)
    .map((p, i) => ({
      filename: (p.filename || `photo-${i + 1}.jpg`),
      content: Buffer.from(p.content, 'base64')
    }));

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: b.email || undefined,
      subject: `New booking — ${b.load} on ${b.pickup_date}`,
      attachments: attachments.length ? attachments : undefined,
      html: `
        <h2>New HaulKC Booking</h2>
        <table>
          <tr><td><b>Name</b></td><td>${b.name}</td></tr>
          <tr><td><b>Phone</b></td><td>${b.phone}</td></tr>
          <tr><td><b>Address</b></td><td>${b.address}, ${b.zip}</td></tr>
          <tr><td><b>Load</b></td><td>${b.load}</td></tr>
          <tr><td><b>Extras</b></td><td>${b.addons}</td></tr>
          <tr><td><b>Price</b></td><td>$${b.starting_price}+</td></tr>
          <tr><td><b>Date</b></td><td>${b.pickup_date} — ${b.time_window}</td></tr>
          <tr><td><b>Email</b></td><td>${b.email}</td></tr>
          <tr><td><b>Photos</b></td><td>${attachments.length ? attachments.length + ' attached' : 'none'}</td></tr>
        </table>
      `
    });

    if (error) {
      // Resend returns errors as a value, not a thrown exception.
      console.error('notify-crew: Resend error', error);
      return res.status(502).json({ ok: false, error: String(error.message || error) });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (e) {
    console.error('notify-crew: send threw', e);
    return res.status(500).json({ ok: false, error: 'send failed' });
  }
}
