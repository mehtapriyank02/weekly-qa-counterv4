# Weekly QA Counter v1000 - Vibrant

Same features and data as every version before it (weekly counts/targets,
fail tracking, leave/PTO coverage, admin assignment management, week
history, trend chart, streaks, dark mode). This is a full visual overhaul -
no Supabase queries, tables, or admin/QA logic changed, but almost every
pixel of the UI did.

Third design pass. v900 was teal/soft-UI, v910 was Stripe-style clean
light - both were called out as still looking "basic." This one goes bold:

- **Color**: a violet-to-fuchsia gradient brand instead of one flat color,
  used on the header, buttons, and logo. Each stat card gets its own hue
  (violet/fuchsia/cyan/rose/lime/blue/amber) instead of one repeated tint.
- **Avatars**: every QA member now gets a consistent color (hashed from
  their name) that shows up as a small initials circle next to their name
  everywhere - the table, the trend chart lines, the streaks list. Same
  person, same color, everywhere in the app.
- **Shapes**: chunkier rounded corners (14-24px), colored soft shadows
  (tinted violet instead of plain gray) instead of flat/sharp edges.
- **Motion, for real this time**:
  - Stat card numbers count up from 0 on load/refresh instead of just
    appearing.
  - Buttons have a bouncy overshoot press (`cubic-bezier(.34,1.56,.64,1)`)
    instead of a flat scale.
  - The header gradient slowly shifts on a 10s loop.
  - The streak flame flickers when a streak is active.
  - A "Done" status pill pops in with a little bounce the moment a row
    completes.
  - A toast notification ("Kiran hit target this week") now appears
    alongside the confetti burst when an agent hits target.
  - Everything still respects `prefers-reduced-motion` - all of the above
    turns off for anyone with that OS setting on.
- **Dark mode**: rebuilt again to match - deep violet-black instead of
  navy or teal-black, same vivid accent colors carried through.

Everything else - icons (no emoji), focus rings, touch targets, tabular
numbers, all admin/QA permission logic - carries over unchanged.

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

This repo is already wired to GitHub Pages - push to `main` and the live
site updates automatically within a minute or two. A hard refresh
(Ctrl+Shift+R) clears any cached old version if a refresh alone doesn't
show the change.

For a fresh Supabase project only: open Supabase -> SQL Editor -> paste in
`supabase-setup-v700.sql` -> Run. It's safe to re-run on a project that
already has this schema (every table/insert is guarded with
`if not exists` / `where not exists`).
