const WIX_SITE_ID = '6e6b6634-c22b-4a4e-bf5a-28cca8d3e272';
const WIX_FORM_ID = '488f4551-badb-4d67-9246-a2c796343b57';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const { name, phone, email } = req.body || {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'invalid_name' });
    return;
  }
  if (typeof phone !== 'string' || phone.replace(/[^0-9]/g, '').length < 9) {
    res.status(400).json({ error: 'invalid_phone' });
    return;
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    res.status(400).json({ error: 'invalid_email' });
    return;
  }

  const apiKey = process.env.WIX_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  try {
    const wixRes = await fetch('https://www.wixapis.com/form-submission-service/v4/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'wix-site-id': WIX_SITE_ID
      },
      body: JSON.stringify({
        submission: {
          formId: WIX_FORM_ID,
          submissions: {
            first_name: name.trim(),
            form_field: phone.trim(),
            email: email.trim()
          }
        }
      })
    });

    if (!wixRes.ok) {
      const errBody = await wixRes.text();
      console.error('Wix submission failed', wixRes.status, errBody);
      res.status(502).json({ error: 'wix_submission_failed' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Wix submission error', err);
    res.status(502).json({ error: 'wix_submission_failed' });
  }
};
