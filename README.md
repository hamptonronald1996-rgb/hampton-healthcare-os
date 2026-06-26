# Hampton Healthcare OS — Sprint 1 Beta

A secure operations dashboard for Hampton Healthcare Services.

## Included
- Secure Supabase login
- Executive dashboard
- Client CRM
- Caregiver CRM
- Document center starter
- Scheduling placeholder for Sprint 2
- Compliance checklist

## Setup
1. Create/open Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in Supabase URL and anon key.
4. Run `npm install` then `npm run dev`.
5. Create first admin account from the login screen.

## Deploy
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel, then run `vercel --prod`.

## Next Sprint
Scheduling, recurring visits, open shifts, caregiver assignments, and timesheets.
