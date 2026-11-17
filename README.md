# othaimeengrp.com: Bin Othaimeen Group website

Custom static rebuild (Astro + a small PHP contact form) of the old WordPress/Elementor site, which ran on
Effentii Corp's server until it is switched off on 25 Nov 2026. Same setup as `leadcrystal-website`.

## Pages

| URL | Source |
|---|---|
| `/` | `src/pages/index.astro` |
| `/services/`, `/service/<slug>/` (10) | `src/data/services.json`, laid out by `src/lib/blocks.ts` |
| `/leadcrystal/` | `src/pages/leadcrystal.astro` |
| `/company-overview/`, `/our-partners/`, `/careers/` | `src/pages/company-overview/` |
| `/news/`, `/<article-slug>/` (2) | `src/data/posts.json` (old URLs kept) |
| `/contact/` | form posts to `/api/contact.php` |

Old WordPress URLs are 301-redirected in `scripts/postbuild.mjs` (generates `dist/.htaccess`). The theme's demo
pages (fake team, "Consulting WP" history and approach) were not carried over and redirect to the overview.
Old logo files stay at their `/wp-content/uploads/...` paths in `public/` because email signatures load them.

## Content changes from the old site

- Food & Beverage: the old page had the Hospitality page's text pasted in plus a leftover AI-tool instruction.
  Only its own copy is kept (`scripts/import-wp.py` does this).
- Effentii Corp removed from partners. SOHO Hospitality (shown on the old homepage) added to the partners page.
- The 2023 "Office & Admin Assistant" vacancy is not listed; careers points to recruiting@.
- No GA4, reCAPTCHA or Instagram/Twitter widgets (none were set up for BOG).

## Commands

```bash
npm install
python3.12 -I scripts/import-wp.py   # one-time: re-pull content and images from the old site (while it exists)
npm run images                       # assets-src/ -> public/images/ (WebP, icons, share image)
npm run build                        # dist/ + dist/.htaccess + dist/api
```

Local preview with the PHP form working: `php -S 127.0.0.1:8788 -t dist scripts/php-router.php`.

## Hosting and deploy

Same pattern as Leadcrystal: push to `main`, `.github/workflows/deploy.yml` builds and commits `dist/` to the
`deploy` branch, and Hostinger pulls `deploy` into public_html (plain Git deploy, cron runs
`server/hostinger-deploy.sh`). Never use hPanel's "Connect with GitHub" for this repo.

Mail settings live outside the repo in `domains/othaimeengrp.com/othaimeen-private/config.php`
(see `server/api/config.example.php`). With no password set, enquiries are logged to
`othaimeen-private/data/submissions.jsonl` and not emailed.

## Domain and DNS

See `docs/dns-othaimeengrp-2026-11-17.md` for every record on Effentii's nameservers and which to keep.
The VPS subdomains (crm, erp, pim, portal, webhook) must be recreated before nameservers change.
