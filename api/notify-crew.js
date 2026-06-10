import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const b = req.body;

  await resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to: process.env.CREW_EMAILS.split(','),
    subject: `New booking — ${b.load} on ${b.pickup_date}`,
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
      </table>
    `
  });

  res.status(200).json({ ok: true });
}
