import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Escape booking fields before dropping them into the crew email so a hostile
// submission can't inject markup/links into the inbox.
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  // as base64. Cap count and total size defensively so a hostile or oversized
  // payload can't blow up the email (and to stay under Resend/Vercel limits).
  const MAX_PHOTOS = 6;
  const MAX_TOTAL_BYTES = 8 * 1024 * 1024; // ~8MB of decoded image data
  let runningBytes = 0;
  const attachments = (Array.isArray(b.photos) ? b.photos.slice(0, MAX_PHOTOS) : [])
    .filter(p => p && typeof p.content === 'string')
    .map((p, i) => {
      const buf = Buffer.from(p.content, 'base64');
      runningBytes += buf.length;
      if (runningBytes > MAX_TOTAL_BYTES) return null;
      const safeName = String(p.filename || `photo-${i + 1}.jpg`).replace(/[^\w.\-]/g, '_').slice(0, 50);
      return { filename: safeName, content: buf };
    })
    .filter(Boolean);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: b.email || undefined,
      subject: `New booking — ${esc(b.load)} on ${esc(b.pickup_date)}`,
      attachments: attachments.length ? attachments : undefined,
      html: `
        <h2>New HaulKC Booking</h2>
        <table>
          <tr><td><b>Name</b></td><td>${esc(b.name)}</td></tr>
          <tr><td><b>Phone</b></td><td>${esc(b.phone)}</td></tr>
          <tr><td><b>Address</b></td><td>${esc(b.address)}, ${esc(b.zip)}</td></tr>
          <tr><td><b>Load</b></td><td>${esc(b.load)}</td></tr>
          <tr><td><b>Extras</b></td><td>${esc(b.addons)}</td></tr>
          <tr><td><b>Price</b></td><td>$${esc(b.starting_price)}+</td></tr>
          <tr><td><b>Date</b></td><td>${esc(b.pickup_date)} — ${esc(b.time_window)}</td></tr>
          <tr><td><b>Email</b></td><td>${esc(b.email)}</td></tr>
          <tr><td><b>Photos</b></td><td>${attachments.length ? attachments.length + ' attached' : 'none'}</td></tr>
        </table>
      `
    });

    if (error) {
      // Resend returns errors as a value, not a thrown exception.
      console.error('notify-crew: Resend error', error);
      return res.status(502).json({ ok: false, error: String(error.message || error) });
    }

    // Send a confirmation email to the customer if they provided one.
    // Failure here is non-fatal — crew already got their notification.
    if (b.email && typeof b.email === 'string' && b.email.includes('@')) {
      try {
        await resend.emails.send({
          from,
          to: [b.email.trim()],
          subject: `Your HaulKC pickup is confirmed — ${esc(b.pickup_date)}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
              <h2 style="color:#1a4731;margin-bottom:4px">You're booked, ${esc(b.name || 'there')}.</h2>
              <p style="color:#555;margin-top:0">Here's your booking summary. The crew will reach out to confirm the exact arrival time.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0">
                <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;width:140px">Date</td><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(b.pickup_date)}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Time window</td><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(b.time_window)} CT</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Load size</td><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(b.load)}</td></tr>
                ${b.addons && b.addons !== 'none' ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Extras</td><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(b.addons)}</td></tr>` : ''}
                <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Starting price</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:700">$${esc(String(b.starting_price))}+</td></tr>
                <tr><td style="padding:8px 0;color:#888">Address</td><td style="padding:8px 0">${esc(b.address)}, ${esc(b.zip)}</td></tr>
              </table>
              <p style="color:#555;font-size:14px">Pay on the day of the job — cash or Venmo in person. No deposit required.</p>
              <p style="color:#555;font-size:14px">Questions? Call or text us at <a href="tel:8163845010" style="color:#1a4731;font-weight:700">(816) 384-5010</a></p>
              <p style="color:#aaa;font-size:12px;margin-top:24px">All online quotes are estimates. Final pricing is confirmed on-site before work begins.</p>
            </div>
          `
        });
      } catch (customerEmailErr) {
        console.error('notify-crew: customer confirmation email failed', customerEmailErr);
      }
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (e) {
    console.error('notify-crew: send threw', e);
    return res.status(500).json({ ok: false, error: 'send failed' });
  }
}
