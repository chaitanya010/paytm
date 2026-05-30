# ReviewSense

Turn app store reviews into UI improvement mockups for PMs.

## Local setup

```bash
cp .env.local.example .env.local
# Fill in your ANTHROPIC_API_KEY
# For local dev, KV keys can be left blank (uses in-memory fallback)
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import project at vercel.com
3. Add Storage → KV Database → link to project
4. Add env var: `ANTHROPIC_API_KEY`
5. KV vars auto-populate from storage link
6. Deploy

## Add screenshots for accurate mockups

Place default screenshots in:
```
public/default-screens/paytm/   (01.png, 02.png, ...)
public/default-screens/phonepe/
public/default-screens/gpay/
```

These are used when no screenshots are uploaded.

## Add more apps

1. Add entry to `lib/constants.ts` APPS object
2. Add AppId type to `types/index.ts`
3. Screenshots optional but recommended
