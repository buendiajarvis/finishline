module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let raw = '';
  await new Promise((resolve, reject) => {
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', resolve);
    req.on('error', reject);
  });

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { name, email, phone, company, request_type, urgency, message, _honey } = data;

  // Honeypot: real users never fill this
  if (_honey) {
    return res.status(200).json({ success: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const body = `New MSP customer request:

Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Company: ${company || 'N/A'}
Type of Request: ${request_type || 'N/A'}
Urgency: ${urgency || 'N/A'}

Message:
${message}

---
Submitted via finishlinemsp.com/msp/contact`;

  try {
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FinishLine MSP <register@aiworx4me.com>',
        to: ['phil@finishlinemsp.com'],
        reply_to: email,
        subject: 'FinishLine MSP — Customer Request',
        text: body
      })
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error('Resend error:', err);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend call error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
