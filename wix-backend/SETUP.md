# Connecting the signup form to Wix (osteoliftingpro.com)

The landing page's form now POSTs to a Wix backend endpoint instead of
faking success. Two things need to happen on the Wix side before it
actually works:

## 1. Add the backend function

1. Open the **osteolifting workout program** site in the Wix Editor
   (osteoliftingpro.com).
2. Turn on **Dev Mode** → **Backend** → **+** → create a file named
   exactly `http-functions.js`.
3. Paste in the contents of [`http-functions.js`](./http-functions.js)
   from this folder.
4. Publish the site.

This exposes `https://www.osteoliftingpro.com/_functions/submitSignup`,
which creates a Wix Contact from each form submission and labels it
`landing-page-7-day-challenge`. It does **not** send any email itself.

## 2. Create the actual email automation

There's no API for this part — set it up once in the dashboard:

1. Wix dashboard → **Automations** → **Create Automation**.
2. Trigger: **Contact labeled** → label = `landing-page-7-day-challenge`.
3. Action: **Send an email** — pick or write the welcome sequence.

## 3. Lock down CORS (recommended once the page has a real domain)

In `http-functions.js`, change:

```js
const ALLOWED_ORIGIN = '*';
```

to the landing page's actual domain, e.g.:

```js
const ALLOWED_ORIGIN = 'https://tomwininger-droid.github.io';
```

`*` works for testing but lets any site on the internet call the
endpoint.
