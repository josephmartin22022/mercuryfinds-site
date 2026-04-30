# Mercury Finds — Website (Phase 1 / Tonight)

Built 2026-04-29 evening. Vanilla HTML/CSS/JS. No build step. Drops into Cloudflare Pages tomorrow.

## What's here

```
mercury_site/
├── index.html          ← Home page (only page built tonight)
├── css/
│   ├── design.css      ← Design system (colors, fonts, spacing)
│   └── site.css        ← Components (header, footer, hero, cards)
├── js/
│   └── site.js         ← Nav toggle, newsletter form, smooth scroll
└── assets/
    └── mercury-mark.svg  ← Logo / favicon
```

## How to preview locally

```bash
cd ~/jarvis/mercury_site
python3 -m http.server 8080
```

Then open `http://localhost:8080` in Safari. Press Cmd+R to refresh after edits.

## Design choices made tonight

- **Aesthetic:** warm/editorial — cream background (#FAF7F0), deep ink (#1A1614), terracotta accent (#B8472D)
- **Typography:** Fraunces (display serif) + Newsreader (body serif), loaded from Google Fonts CDN
- **Voice:** friendly/personal — Joseph + Mercury story forward
- **Logo:** existing Mercury planet icon (used everywhere — Linktree, social, now site)

## What's in tonight's home page

1. **Header** — sticky, with logo + nav (Home / Products / About / Journal / Contact)
2. **Hero** — "Productivity systems, *built differently.*" with Joseph's intro and aside about how guides are made
3. **Bundles section** — three Gumroad bundle cards: $19, $99, $149 (featured)
4. **Story section** — Joseph and Mercury, transparent "Made with AI" angle
5. **Manifesto** — four numbered statements about what Mercury Finds believes
6. **Newsletter capture** — email form for free 5-page sample (needs Beehiiv wired tomorrow)
7. **Footer** — dark, four columns, "Drafted by AI · Edited by a human · Made on Earth"

## What's NOT done yet (tomorrow)

- [ ] **Products page** — `/products.html` — all individual products + bundles in a grid
- [ ] **Product detail pages** — one per product (5 of them)
- [ ] **About page** — `/about.html` — extended Joseph + Mercury story, transparency
- [ ] **Journal page** — `/blog.html` — empty index, ready for Mercury's blog posts
- [ ] **Contact page** — `/contact.html` — email, social, done-for-you placeholder
- [ ] **Newsletter form wiring** — Cloudflare Worker that proxies Beehiiv API + delivers sample PDF
- [ ] **Cloudflare Pages deployment** — push to a Git repo, connect to Pages, custom domain
- [ ] **Domain switch** — retire the redirect Worker, point `mercuryfinds.com` to Pages
- [ ] **OG images** — social preview images for sharing
- [ ] **Sitemap + robots.txt** — for SEO

## Tomorrow's plan (recap)

| Time | Task |
|---|---|
| 9:00-10:00 | Products grid page |
| 10:00-12:00 | Product detail template + 5 detail pages |
| 12:00-1:00 | Lunch + Mercury 8 AM autonomous run review |
| 1:00-2:00 | About page |
| 2:00-2:30 | Journal index |
| 2:30-3:00 | Contact page |
| 3:00-4:00 | Beehiiv form + Worker + sample PDF delivery |
| 4:00-5:00 | Mobile pass on every page |
| 5:00-5:30 | SEO meta + sitemap + OG |
| 5:30-6:00 | Domain switch (retire Worker, point to Pages) |
| 6:00-7:00 | E2E testing + polish |

EOD tomorrow: live site at mercuryfinds.com.

## Notes

- All product links go to your existing Gumroad URLs — nothing changes on Gumroad's side
- Newsletter form currently logs warnings (Beehiiv not wired yet) but shows success UI optimistically
- All copy was written by Claude tonight — review and redline any of it before live launch
- Mobile responsive confirmed at 390px viewport
- No JavaScript framework, no build step, no node_modules — just HTML/CSS/JS in folders

## Rollback if anything breaks

The site is entirely self-contained in `mercury_site/`. Delete the folder, nothing else changes. The current Cloudflare Worker redirect (`autumn-mouse-e37a` → `linktr.ee/MercuryFinds`) keeps working until we explicitly retire it tomorrow.
