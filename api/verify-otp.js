// api/verify-otp.js
// Ye function customer ke enter kiye hue code ko Redis me stored code se compare karta hai.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // production me apne store ke domain se replace karen
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code } = req.body || {};

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code required' });
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    const getResponse = await fetch(`${redisUrl}/get/otp:${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const getData = await getResponse.json();
    const storedOtp = getData.result;

    if (!storedOtp) {
      return res.status(400).json({ verified: false, error: 'Code expired or not found' });
    }

    if (storedOtp !== code) {
      return res.status(400).json({ verified: false, error: 'Incorrect code' });
    }

    // Code sahi hai - Redis se delete kar den (ek hi baar use ho)
    await fetch(`${redisUrl}/del/otp:${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });

    return res.status(200).json({ verified: true });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
