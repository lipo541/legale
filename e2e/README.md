# E2E (Playwright)

Playwright loads env vars from `.env.e2e.local` by default.

## Run against localhost

1. Create `.env.e2e.local` (already in repo but gitignored) and fill:

- `E2E_BASE_URL=http://localhost:3000`
- `E2E_LOCALE=ka`
- `E2E_EMAIL=your-email`
- `E2E_PASSWORD=your-password`

2. Start app: `npm run dev`
3. In another terminal: `npm run test:e2e`

## Run against production

- Set `E2E_BASE_URL=https://legal.ge` in `.env.e2e.local`
- Run: `npm run test:e2e`

Notes:
- Credentials are read from env vars only.
- The test checks for `sb-*` cookies and that pages don’t get stuck on "Loading".
