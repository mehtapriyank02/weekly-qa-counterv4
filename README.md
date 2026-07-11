# Verity

(Formerly "Weekly QA Counter" — renamed. Same data and permission logic
throughout: weekly counts/targets, fail tracking, leave/PTO coverage, admin
assignment management, week history, trend chart, streaks, dark mode — no
Supabase queries, tables, or admin/QA logic changed by any of the visual
rebuilds below.)

Built as React + Vite: a marketing-style homepage (with a "Meet our
Auditors" section) in front of the actual dashboard, a dark, high-contrast
visual system, and a real top navigation (Workstream hover menu → Meet our
Auditors → Download → Reports → Manage) instead of tabs + a long sidebar.

Notable fixes/additions along the way:
- **Agents can be moved between workstreams**, and **hidden agents can be
  viewed and restored** (Manage → Agents) — previously hiding an agent was a
  dead end with no way back.
- The stat-card grid no longer forces the whole page to scroll horizontally;
  only the data table scrolls on its own when it needs to.
- The daily count control is a clear capsule stepper (distinct minus/plus
  zones, count in its own cell) instead of a "−" button that looked
  identical to the number next to it.
- **Download** exports the current week's visible table as a CSV.
- The QA column is hidden on a QA member's own table view (every row is
  trivially their own name there) — still shown for admins viewing everyone.

Config is already filled in with your Supabase project
(`gvporifcjbenmhuewzqb.supabase.co`) and anon key, so you shouldn't need to
edit `src/lib/config.js` unless you're pointing this at a different Supabase
project.

## How many weeks the analytics look back

Open `src/lib/helpers.js` and find this near the top:

```js
export const ANALYTICS_WEEKS = 12;
```

Change `12` to whatever lookback you want (e.g. `26` for ~6 months). No SQL
changes needed either way.

## Local development

```
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Deployment (GitHub Pages via GitHub Actions)

This has a build step (Vite), so plain "serve the repo root" GitHub Pages
doesn't work. `.github/workflows/deploy.yml` builds the app and deploys
`dist/` on every push to `main`.

**One-time setup on GitHub**: go to the repo's **Settings → Pages** and
change **Source** from "Deploy from a branch" to **"GitHub Actions"**. After
that, pushing to `main` builds and deploys automatically — no more manual
branch/folder configuration.

For a fresh Supabase project only: open Supabase -> SQL Editor -> paste in
`supabase-setup-v700.sql` -> Run. It's safe to re-run on a project that
already has this schema (every table/insert is guarded with
`if not exists` / `where not exists`).
