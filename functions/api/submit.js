const WIX_SITE_ID = '6e6b6634-c22b-4a4e-bf5a-28cca8d3e272';
const WIX_FORM_ID = '488f4551-badb-4d67-9246-a2c796343b57';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const { name, phone, email } = body || {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    return json(400, { error: 'invalid_name' });
  }
  if (typeof phone !== 'string' || phone.replace(/[^0-9]/g, '').length < 9) {
    return json(400, { error: 'invalid_phone' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    return json(400, { error: 'invalid_email' });
  }

  if (!env.WIX_API_KEY) {
    return json(500, { error: 'server_misconfigured' });
  }

  try {
    const wixRes = await fetch('https://www.wixapis.com/form-submission-service/v4/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': env.WIX_API_KEY,
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
      console.error('Wix submission failed', wixRes.status, await wixRes.text());
      return json(502, { error: 'wix_submission_failed' });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('Wix submission error', err);
    return json(502, { error: 'wix_submission_failed' });
  }
}
