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
    console.error('JSON parse error:', e);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { name, email, phone, location, experience } = data;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const apiKey = 're_4GwJygvc_C6cbMjhQZX7o2azRahjgB61h';
  const from = 'register@aiworx4me.com';

  const locationLabels = {
    'downtown-la': 'Downtown LA',
    'san-diego': 'San Diego',
    'fresno': 'Fresno',
    'san-francisco': 'San Francisco',
    'sacramento': 'Sacramento',
    'other': 'Other / Online'
  };

  const experienceLabels = {
    'never': 'Never used AI',
    'once': 'Have tried it once or twice',
    'sometimes': 'Use it sometimes',
    'regularly': 'Use it regularly'
  };

  const locDisplay = location ? (locationLabels[location] || location) : 'N/A';
  const expDisplay = experience ? (experienceLabels[experience] || experience) : 'N/A';

  const body = `A new workshop registration:

Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Preferred Location: ${locDisplay}
AI Experience: ${expDisplay}

--- 
Submitted via Aiworx4me Workshop`;

  try {
    // Send notification to Phil
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({
          from,
          to: ['register@aiworks4me.com'],
          subject: 'Aiworx4me Workshop Registration',
          text: body
        })
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Send autoresponse to registrant (non-blocking)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Aiworx4me Workshop — Registration Confirmed',
          text: `Thank you for registering for the Aiworx4me AI Workshop!

We'll send you the workshop details (time, location, and prep materials) 24 hours before the event.

Questions? Reply to this email.

— Aiworx4me`
        })
      });
    } catch (autorespErr) {
      console.warn('Autoresponse failed:', autorespErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend call error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
