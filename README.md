# Preparing For The Antichrist App

A companion app for the debate-prep deck **"Answering the Edomite Myth: The opponent's case, reconstructed and stress-tested."**
It presents the material as 23 neutral chapters (the claim, the sources cited, the key facts and a plain-language explanation), 27 transcript topics, a glossary, a chat at the end of every chapter and one main chat.

> Antisemitic claims are presented for critical examination, not endorsement.

Chapter text comes word-for-word from `deck.pptx` (slides 2-23 and 25) and `plain-language-guide.pdf` (see `src/data/`).

## Images
Save chapter images as `public/images/chapters/chapter-01.png` ... `chapter-23.png` and the main image as `public/images/hero.png` (16:9). Until a file exists the app shows the built-in illustration (`fallback-NN.svg`). Prompts are in `IMAGE-PROMPTS.md`. Commit and push to publish.

## What's inside
| Page | Address |
|---|---|
| Home / chapter list | `/` |
| Chapters (chat at the end of each) | `/chapters/1/` ... `/chapters/23/` |
| Main chat (all chapters) | `/chat/` |
| Transcript topics | `/topics/` |
| Glossary | `/glossary/` |
| Community rules and terms | `/rules/` |

Tech: Next.js 15 + TypeScript + Tailwind (static export), PWA (installable), Capacitor 7 for iOS/Android, Supabase (free tier) for chat.

## Costs
Everything here runs on free tiers (GitHub, Vercel Hobby, Supabase Free, Codemagic free minutes). Publishing to stores costs extra:
- **Apple Developer Program: $99 per year** (needed for TestFlight/App Store).
- **Google Play Console: $25 one-time.**

## Run it on Windows (PowerShell)
Install [Node.js 20 LTS](https://nodejs.org) and [Git](https://git-scm.com/download/win), then:
```powershell
git clone https://github.com/mattkamrath10/preparing-for-the-antichrist-app.git
cd preparing-for-the-antichrist-app
npm install
Copy-Item .env.example .env.local   # then fill in the two Supabase values (optional)
npm run dev
```
Open http://localhost:3000. Without Supabase values, everything works except chat, which shows a "Chat is not set up yet" message.

## Supabase (chat) - free tier
1. Go to https://supabase.com, sign in, **New project** (any name, free plan). Wait for it to start.
2. **SQL Editor → New query**, paste all of `supabase/migrations/0001_chat.sql`, click **Run**. Then do the same with `0002_rooms_usernames_anonymous.sql`.
3. **Authentication → Sign In / Providers → Email**: keep it enabled (magic links are on by default).
4. **Authentication → URL Configuration**: set **Site URL** to your Vercel address `https://preparing-for-the-antichrist-app.vercel.app` and add `https://preparing-for-the-antichrist-app.vercel.app/**`, `http://localhost:3000/**` and `https://*.vercel.app/**` to **Redirect URLs**. For the phone apps also add `capacitor://localhost/**` and `http://localhost/**`.
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key into `.env.local` and into Vercel (below).
6. Make yourself a moderator: open the app, sign in once on any chat page and accept the rules, then run in SQL Editor:
   ```sql
   update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOUR-EMAIL');
   ```
   Admins see **Hide/Unhide** on every post. Reports are in the `reports` table (Table Editor). Ban a user with `update public.profiles set banned = true where id = '...';`

Members can set a unique username (filtered, editable) and tick **Post as Anonymous** per message; anonymous posts show "Anonymous" but report, block and moderator hide still work.

Moderation built in (Apple guideline 1.2): rules + terms must be accepted before posting, hate-term filter (client and database), report, block author, admin hide, auto-hide after 3 reports.

## Vercel (website)
The site is connected to Vercel. To add chat to the live site:
1. https://vercel.com → project **preparing-for-the-antichrist-app** → **Settings → Environment Variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production + Preview).
3. **Deployments → ... → Redeploy**.

If you ever need to set it up again: **Add New → Project → Import** the GitHub repo, framework **Next.js**, no other changes. Every `git push` to `main` redeploys.

### Install as a desktop app (PWA)
Open the live site in Chrome or Edge → click the install icon in the address bar (or menu → **Apps → Install this site as an app**).

## Android (Android Studio on Windows)
1. Install [Android Studio](https://developer.android.com/studio).
2. In PowerShell in the project folder:
   ```powershell
   npm run export:mobile      # builds the site into .\out and copies it into .\android
   npx cap open android       # opens Android Studio
   ```
3. Wait for Gradle sync, pick an emulator or a phone (USB debugging on) and press **Run ▶**.
4. Store build: **Build → Generate Signed Bundle / APK → Android App Bundle**, create a keystore (keep it safe, you need it for every update), build **release**. Upload the `.aab` in the [Google Play Console](https://play.google.com/console) ($25 one-time).

## iOS with Codemagic (no Mac needed)
1. Join the Apple Developer Program ($99/yr).
2. In [App Store Connect](https://appstoreconnect.apple.com): **Apps → + → New App**, bundle ID `com.matthewkamrath.preparingfortheantichrist` (create it first under Certificates, Identifiers & Profiles → Identifiers).
3. App Store Connect → **Users and Access → Integrations → App Store Connect API → +**, role **App Manager**. Download the `.p8` key; note the Issuer ID and Key ID.
4. Sign in at https://codemagic.io with GitHub, add the repo.
5. Codemagic → **Team settings → Integrations → Developer Portal → Connect**, upload the key, and name it exactly `CodemagicASC`.
6. Codemagic → app → **Environment variables**: create group `supabase` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Codemagic → **Code signing identities**: let it generate an iOS distribution certificate and fetch an App Store profile for the bundle ID.
8. **Start new build** → workflow **iOS release**. The build appears in TestFlight in App Store Connect.

App Review note: the chat is user-generated content, so the app already has rules/terms acceptance, filtering, report, block and moderator hide. Give Apple a demo email in the review notes so they can sign in.

## Updating content
Chapter text is in `src/data/chapters.json`, topics in `src/data/topics.json`, guide text in `src/data/guide.json`. Edit, then `git commit` and `git push`; Vercel redeploys automatically.
