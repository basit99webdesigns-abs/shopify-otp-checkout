// api/send-otp.js
// Ye function Vercel par deploy hoga. Ye OTP generate karta hai, use temporarily
// store karta hai (Upstash Redis me, 5 minute expiry ke sath), aur customer ke
// email par bhejta hai (Resend API se).

export default async function handler(req, res) {
  // CORS headers - taake aapka Shopify store (dusra domain) is API ko call kar sake
  res.setHeader('Access-Control-Allow-Origin', '*'); // production me apne store ke domain se replace karen
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // 6-digit OTP generate karen
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // OTP ko Upstash Redis me store karen, 5 min (300 sec) expiry ke sath
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    await fetch(`${redisUrl}/set/otp:${encodeURIComponent(email)}/${otp}/EX/300`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });

    // Email bhejen (Resend API)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL, // e.g. 'verify@yourstore.com' (Resend me verified domain)
        to: email,
        subject: 'Your verification code',
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p>`,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      console.error('Resend error:', errText);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
