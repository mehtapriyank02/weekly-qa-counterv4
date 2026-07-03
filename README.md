# Weekly QA Counter v910 - Clean light (Stripe-style)

Same features and data as v900/v800 (trend chart, fail-rate history, streaks
+ confetti, dark mode, plus everything from v700: leave/PTO, assignments,
agents, settings, history, admin/QA roles). This pass is purely visual - no
Supabase queries, tables, or admin/QA logic changed.

Second design pass after v900's teal/soft-UI look. You picked "clean light,
Stripe style" from a set of mockups, so this rebuilds the palette and,
notably, the header:

- **Header**: was a bold dark teal gradient block - now a plain white card
  with a 1px border, matching the rest of the panels. Logo is a small solid
  indigo square instead of a big glossy badge. Tabs are now a segmented
  control (light gray track, active tab lifts to white) instead of
  translucent pills on a dark background.
- **Palette**: indigo `#635BFF` primary (Stripe's own brand color), navy
  `#0A2540` text, cool gray-blue page background `#F6F9FC`, softer/lighter
  shadows than v900 (`rgba(10,37,64,...)` instead of heavier teal shadows).
- **Corners**: tightened from v900's 20-26px "pill" cards down to 10-16px -
  a crisper, more corporate-dashboard proportion.
- **Buttons**: secondary/danger buttons are now bordered outline style
  (white bg, colored text/border) rather than solid tinted fills, which
  reads calmer next to the white header/panels.
- **Dark mode**: rebuilt from scratch to match (near-black `#0A0E14`
  surfaces, lighter indigo `#8B85FF` for contrast) rather than reusing
  v900's dark-teal variant.

Everything else - icons (no emoji), motion, focus rings, touch targets,
tabular numbers - carries over unchanged from v900.

Config is already filled in with your Supabase project
(`gvporifcjbenmhuewzqb.supabase.co`) and anon key, so you should not need to
edit `config.js` unless you're pointing this at a different Supabase project.

## How many weeks the analytics look back

Open `app.js` and find this near the top:

```js
const ANALYTICS_WEEKS = 12;
```

Change `12` to whatever lookback you want (e.g. `26` for ~6 months). No SQL
changes needed either way.

## Setup

1. **Supabase SQL**: only needed if this is a brand-new Supabase project, or
   you're not sure the tables already exist. Open your Supabase project ->
   SQL Editor -> paste in `supabase-setup-v700.sql` -> Run. It's written to
   be safe to re-run (every table/insert is guarded with `if not exists` /
   `where not exists`), so running it again on a project that already has
   this schema is harmless and won't duplicate data. If you already ran
   this for v700/v800/v900 on this same project, skip this step entirely.
2. Upload all files (`index.html`, `styles.css`, `app.js`, `config.js`,
   `supabase-setup-v700.sql`) to your GitHub repo, replacing the old ones.
3. Enable GitHub Pages: Settings -> Pages -> Source: Deploy from a branch ->
   Branch: `main` / root.
4. Open: `https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME/?v=910`
