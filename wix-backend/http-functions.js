/**
 * Paste this whole file into: osteoliftingpro.com → Editor → Dev Mode →
 * Backend → new file named exactly "http-functions.js".
 *
 * It exposes a public endpoint at:
 *   https://www.osteoliftingpro.com/_functions/submitSignup
 *
 * The landing page's signup form POSTs {name, phone, email} here. This
 * function creates/updates a Wix Contact, elevated past the normal
 * anonymous-visitor permission wall (visitors can't create contacts
 * directly — see https://dev.wix.com/docs/go-headless/authentication/admin/elevate-api-call-permissions-with-the-astro-integration).
 *
 * It does NOT send the email itself. It labels the contact
 * "landing-page-7-day-challenge" — set up a Wix Automation (Automations
 * app → Create → Trigger: "Contact labeled" → that label → Action: Send
 * Email) to fire the actual welcome email. That part has to be done by
 * hand in the dashboard; there's no API for creating automations.
 */

import { ok, badRequest, response } from 'wix-http-functions';
import { contacts } from 'wix-crm-backend';
import { elevate } from 'wix-auth';

// Restrict this once the landing page's real domain is known — e.g.
// 'https://tomwininger-droid.github.io'. '*' works everywhere meanwhile.
const ALLOWED_ORIGIN = '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handles the browser's CORS preflight request.
export function options_submitSignup() {
  return response({ status: 204, headers: CORS_HEADERS });
}

export async function post_submitSignup(request) {
  try {
    const payload = await request.body.json();
    const { name, phone, email } = payload;

    if (!name || !phone || !email) {
      return badRequest({
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: { error: 'name, phone and email are all required' },
      });
    }

    const contactInfo = {
      name: { first: String(name).trim() },
      emails: [{ tag: 'MAIN', email: String(email).trim() }],
      phones: [{ tag: 'MOBILE', phone: String(phone).trim() }],
      labelKeys: ['custom.landing-page-7-day-challenge'],
    };

    // createContact needs CONTACTS.MODIFY, which an anonymous visitor
    // doesn't have — elevate() runs it with the site's own permissions.
    const elevatedCreateContact = elevate(contacts.createContact);
    const contactId = await elevatedCreateContact(contactInfo);

    return ok({
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: { success: true, contactId },
    });
  } catch (err) {
    console.error('submitSignup failed:', err);
    return badRequest({
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: { error: 'Could not save signup. Please try again.' },
    });
  }
}
