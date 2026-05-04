# Vercel Deployment

This project is a Next.js App Router application. Vercel must deploy from the folder that contains:

- `app/`
- `components/`
- `package.json`
- `next.config.js`
- `vercel.json`

## Correct Root Directory

If your GitHub repository contains this project inside a folder named `RC Site`, set:

```text
Root Directory: RC Site
```

If your repository root already contains `app/` and `package.json`, leave Root Directory empty.

The Vercel error below means the wrong folder is being deployed:

```text
Couldn't find any `pages` or `app` directory.
```

## Build Settings

```text
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

## Environment Variables

Set these in Vercel Project Settings:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

The app can still render without these variables, but Supabase/OpenAI-backed features require them.

## Notes

NPM deprecation warnings during install are not deployment blockers. The actual deployment blocker is any line marked `Error`.
