# Raise My Mac

A small public site that turns sponsorships into a better development machine. Every paid contribution moves a live upgrade ladder: the current Mac configuration, the next one, and how much is left.

## Stack

Next.js App Router, TypeScript, Tailwind, SQLite (`better-sqlite3`), and [Dodo Payments](https://dodopayments.com) — the same provider and checkout/webhook pattern used by gethigh.today. This project has its own database, env vars, and Dodo product. Do not reuse gethigh keys or product IDs.

## Configure the machine ladder

Edit `config/spots.ts` for placement prices and positions. Taken spots can be claimed by paying 1.5× the current amount. After changing the file, open `/admin` and reload spot defaults.

Edit `config/machine-tiers.ts`. `amountRequired` is the Apple India price for that configuration, converted to USD. It is the cumulative amount that unlocks it.

Site defaults (minimum amount, presets, social proof placeholders) live in `config/site.ts` and can also be edited in admin.

## Environment

Copy `.env.example` to `.env.local`. Leave Dodo blank to use a local mock checkout at `/sponsor/mock/[paymentId]`.

| Name | Purpose |
| --- | --- |
| `APP_URL` | Public origin for return/cancel URLs |
| `DB_PATH` | SQLite file. Use a persistent volume in production. |
| `ADMIN_PASSWORD` | Required to open `/admin` |
| `ADMIN_SECRET` | Optional cookie signing secret |
| `DODO_PAYMENTS_API_KEY` | Dodo API key |
| `DODO_PRODUCT_ID` | Dedicated Pay What You Want product |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Webhook signing key |
| `DODO_PAYMENTS_ENV` | `test_mode` or `live_mode` |

Webhook URL: `{APP_URL}/api/webhooks/dodo`

Production refuses localhost `APP_URL`, `test_mode`, or missing live Dodo keys.

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```

A sponsorship is only marked paid after the Dodo webhook (or the mock confirm endpoint when Dodo is not configured). The success page polls payment status and does not trust the redirect alone.
