# Health AI — Personal Health Platform

A full-stack health and fitness web application built with Next.js, TypeScript, Tailwind CSS, Recharts, Supabase, and an AI health coach with multi-provider LLM support (Gemini / Grok / Groq / OpenAI) and a rule-based fallback.

---

## Feature Checklist

| Feature | Status |
|---|---|
| Landing page + onboarding wizard | ✅ Implemented |
| Dashboard (calories, macros, steps, water, sleep, weight, budget) | ✅ Implemented |
| Food & Nutrition (search, log, edit, delete, saved meals, custom foods) | ✅ Implemented |
| Indian food database (44 foods, South Indian dishes) | ✅ Implemented |
| Activity logging (walk, run, cycle, gym, stairs) + MET calories | ✅ Implemented |
| CSV import/export for activity logs | ✅ Implemented |
| Workouts (plan generator, exercise library, set/rep logging, PRs) | ✅ Implemented |
| Weight & Progress (charts, trend smoothing, BMI, goal progress) | ✅ Implemented |
| Protein Cost Intelligence (comparison table, optimizer, budget analysis) | ✅ Implemented |
| Meal Planner + Budget Optimizer | ✅ Implemented |
| AI Health Coach chat (LLM via API route) | ✅ Implemented |
| Rule-based fallback (works without API key) | ✅ Implemented |
| Reports (30/90-day nutrition, activity, weight, spending + CSV export) | ✅ Implemented |
| Settings (profile edit, goals, diet, budget, data reset) | ✅ Implemented |
| Light / dark mode | ✅ Implemented |
| Mobile-responsive (sidebar desktop + bottom nav mobile) | ✅ Implemented |
| BMR/TDEE calculation (Mifflin–St Jeor + Harris–Benedict) | ✅ Implemented |
| Unit-tested calculation engine (48 tests) | ✅ Implemented |
| LocalStorage demo mode (no backend required) | ✅ Implemented |
| Supabase PostgreSQL + RLS schema | ✅ SQL migration provided |
| Vercel deployment ready | ✅ Configured |
| **Barcode scanning / voice logging / food photo recognition** | ⚠️ Extension points designed, not implemented (require external API) |
| **Live Swiggy / Zomato prices** | ⚠️ Not implemented — scraping not authorized; sample prices provided |
| **Wearable / step-counter sync** | ⚠️ Provider abstraction created; no connector implemented |
| **Supabase auth (login/signup)** | ✅ Implemented — `/login` page with email/password; falls back to demo mode when unconfigured |

---

## Quick Start (Windows PowerShell)

### Prerequisites

```powershell
# Requires Node.js 18 or later
node --version   # should be 18+
npm --version
```

### 1 — Clone or open the project

```powershell
cd "C:\Users\N.SRINIVASA ULLOOR\Desktop\Health"
```

### 2 — Install dependencies

```powershell
npm install
```

### 3 — Set up environment variables

```powershell
Copy-Item .env.example .env.local
# Then edit .env.local with your credentials (see sections below)
```

### 4 — Run in development mode

```powershell
npm run dev
# Open http://localhost:3000 in your browser
# Click "Try with Demo Data" to explore immediately without any credentials
```

### 5 — Run tests

```powershell
npm test
# 48 unit tests for the calculation engine
```

### 6 — Lint + typecheck

```powershell
npm run lint
npx tsc --noEmit
```

### 7 — Production build

```powershell
npm run build
npm start
```

---

## Supabase Setup

### Step 1 — Create a project

1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Note your **Project URL** and **anon/public key** from **Project Settings → API**.

### Step 2 — Run the migration

1. Open the Supabase SQL Editor.
2. Open `supabase/migrations.sql` from this project.
3. Paste the entire file and click **Run**.
   This creates all 14 tables with RLS, indexes, triggers, and the food reference seed.

### Step 3 — Enable Email Auth

In Supabase Dashboard → **Authentication → Providers → Email**: enable it.
The `on_auth_user_created` trigger automatically creates a `profiles` row on signup.

### Step 4 — Add to .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only; for seeding only
```

> **Note:** The app fully works in demo mode without Supabase. localStorage is used as a fallback. Connect Supabase to persist data across devices and enable multi-user support.

---

## AI Provider Configuration

Set **one** of the following in `.env.local`. If none is set, a rule-based fallback handles all coach requests — the app remains fully functional.

### Google Gemini (free tier)

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AI...
GEMINI_MODEL=gemini-1.5-flash
```

### xAI Grok (https://x.ai/api — OpenAI-compatible)

```env
AI_PROVIDER=grok
GROK_API_KEY=xai-...
GROK_MODEL=grok-2-latest
```

### Groq (free tier — https://console.groq.com/keys)

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
```

### OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## Vercel Deployment

### Step 1 — Push to GitHub

```powershell
git init
git add .
git commit -m "Initial commit: Health AI full-stack app"
git remote add origin https://github.com/your-username/health-ai.git
git push -u origin main
```

### Step 2 — Import on Vercel

1. Visit [https://vercel.com/new](https://vercel.com/new) and import your repository.
2. Framework preset: **Next.js** (auto-detected).
3. Add the following **Environment Variables** in the Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AI_PROVIDER
GROQ_API_KEY          (or OPENAI_API_KEY / GEMINI_API_KEY)
GROQ_MODEL            (or OPENAI_MODEL / GEMINI_MODEL)
```

4. Click **Deploy**. Subsequent pushes to `main` auto-deploy.

### Step 3 — Update Supabase CORS / redirect URLs

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

---

## Architecture Overview

```
src/
├── app/
│   ├── (app)/          # Protected app routes (AppShell layout + route guard)
│   │   ├── dashboard/
│   │   ├── food/
│   │   ├── meal-planner/
│   │   ├── activity/
│   │   ├── workouts/
│   │   ├── progress/
│   │   ├── protein-cost/
│   │   ├── coach/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/coach/      # Edge route: LLM adapter + rule-based fallback (Zod in/out)
│   ├── login/          # Supabase email/password auth (demo fallback)
│   ├── onboarding/     # Multi-step profile wizard
│   └── page.tsx        # Landing page
├── components/
│   ├── ui/             # shadcn-style components (button, card, dialog, tabs...)
│   ├── layout/         # Sidebar, bottom nav, mobile menu, AppShell
│   ├── shared/         # StatCard, EmptyState, PageHeader, charts
│   └── dialogs/        # AddFood, LogWeight
├── lib/
│   ├── calculations/   # Pure, tested functions (BMR, TDEE, BMI, MET, protein cost)
│   ├── ai/             # LLM adapter (Gemini/Grok/Groq/OpenAI) + rule-based fallback
│   ├── auth/           # Supabase auth provider (session + signIn/signUp/signOut)
│   ├── store/          # DataStore (React context + localStorage) + daily summary hooks
│   ├── demo-data/      # Indian food DB, sample prices, exercises, demo seed generator
│   ├── providers/      # Activity provider abstraction + CSV import/export
│   ├── supabase/       # Browser + server Supabase clients
│   └── validations.ts  # Zod schemas for all forms and API routes
├── types/              # Shared TypeScript domain types
└── tests/              # Vitest unit tests (48 tests for calculation engine)
supabase/
└── migrations.sql      # Full schema: 14 tables, RLS, triggers, seed data
```

### Data Flow

- **Local demo mode**: All data lives in `localStorage` via the `DataStoreProvider`. Zero backend needed.
- **Supabase mode**: When `NEXT_PUBLIC_SUPABASE_URL` is configured, server actions and route handlers use the Supabase client with the user's JWT for RLS enforcement.
- **AI Coach**: Messages are sent to `/api/coach` (Edge runtime). The route reads context computed in the browser, calls the configured LLM, and returns a response. If no key is configured, a deterministic `rule-based.ts` fallback runs server-side.

---

## Calculation Methodology

| Metric | Method |
|---|---|
| BMR | Mifflin–St Jeor (default) or Harris–Benedict (revised) |
| TDEE | BMR × activity multiplier (sedentary 1.2 → extra active 1.9) |
| Calorie target | TDEE ± 500 kcal deficit / 300 kcal surplus (clamped to 1200/1500 floor) |
| Protein target | 1.2–2.0 g/kg (adjusted for BMI >25; lower reference weight used) |
| Activity calories | MET × body weight (kg) × duration (hours) |
| Protein cost | price ÷ protein_grams × target_protein_grams |
| Weight trend | Moving average (window = 3–5) comparing recent 3 entries vs prior 3 |
| BMI | weight(kg) ÷ height(m)² |

All formulas are in `src/lib/calculations/` as pure, unit-tested functions, isolated from UI.

---

## Safety Disclaimers (Built In)

- Calorie targets below 70% of TDEE are flagged as potentially unsafe.
- Targets below 1200 kcal (women) / 1500 kcal (men) are clamped.
- Weight change is never inferred as fat loss from a single day.
- Activity calories are labeled as estimates; never added to BMR twice.
- Restaurant/mixed dish nutritional values are labeled "approximate."
- The AI coach is instructed never to give medical diagnoses or guarantee results.
- Sample prices are clearly labeled `[sample]`; no live Swiggy/Zomato scraping.

---

## Local Development Commands (PowerShell)

```powershell
npm run dev          # Start development server at http://localhost:3000
npm run build        # Production build
npm start            # Run production build locally
npm run lint         # ESLint check
npm run typecheck    # TypeScript check (no emit)
npm test             # Run 48 unit tests (vitest --run)
npm run test:watch   # Watch mode for TDD
```
