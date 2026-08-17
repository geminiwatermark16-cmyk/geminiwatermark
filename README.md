# geminiwatermark.space

Browser-side visible Gemini/Veo watermark-remover UI with a Cashfree-powered ₹99 video upgrade.

## Product flow
- Images: free
- First video: free on the current browser
- Additional video processing: ₹99 video plan
- Cashfree hosted checkout opens from the upgrade modal
- The ₹99 order is created server-side
- Payment is verified server-side with Cashfree before the plan unlocks
- A signed entitlement token is stored locally after successful verification

Media processing remains in the browser. Payment metadata (such as the mobile number entered for checkout and Cashfree order information) is sent to the payment backend/Cashfree as required for checkout.

## Cashfree setup
Create these environment variables in Vercel:

```bash
CASHFREE_CLIENT_ID=your_cashfree_app_id
CASHFREE_CLIENT_SECRET=your_cashfree_secret_key
CASHFREE_ENV=sandbox
SITE_URL=https://geminiwatermark.space
CASHFREE_ENTITLEMENT_SECRET=use_a_long_random_secret_here
```

Start with `CASHFREE_ENV=sandbox`. After testing, change it to `production` and use your production Payment Gateway keys.

Also whitelist `geminiwatermark.space` in the Cashfree Payment Gateway dashboard before live checkout.

Never put `CASHFREE_CLIENT_SECRET` or `CASHFREE_ENTITLEMENT_SECRET` in frontend JavaScript or commit them to GitHub.

## Cashfree endpoints included
- `POST /api/create-order` — creates a server-side ₹99 INR order and returns `payment_session_id`
- `POST /api/verify-order` — fetches the order from Cashfree; unlocks only if status is `PAID` and amount is exactly ₹99 INR
- `POST /api/verify-entitlement` — validates the locally stored signed video-plan token

Cashfree JS SDK v3 is loaded on the frontend and opens the hosted checkout in a modal.

## Processing engine
The browser loads `@pictx/gemini-veo-watermark-remover` from a JavaScript CDN on first use. Selected media is processed client-side by the remover flow.

This implementation targets supported **visible** watermarks only and does not offer SynthID/invisible provenance removal.

## Deploy on Vercel
Import this folder/repository into Vercel with Framework Preset `Other`. The static page and `/api/*` Vercel Functions can live in the same project.

Add the Cashfree environment variables, deploy, then connect `geminiwatermark.space` in Vercel Domains.

## Local checks
```bash
npm run check
```

A plain `python3 -m http.server` can preview the UI, but Cashfree API routes require Vercel Functions (for example `vercel dev`) and valid Cashfree sandbox credentials.

## Important limitation
The one-free-video trial is currently tracked per browser. A user can reset browser storage to reset that trial. If you need strict one-free-video enforcement across browsers/devices, add login + a server-side database/usage ledger.
