# Cricketers Academy

The website of **Cricketers Academy** (by Tellicherry Cricket Club), Dubai — a top-4 UAE
cricket academy based at Shabab Al Ahli Stadium, Al Nahda. Light ProCoach-style design
system: General Sans, bright yellow-lime accent (`#D4F23A`), neutral off-white, near-black
feature bands, real academy photography throughout.

## Pages

| Page | Contents |
|------|----------|
| `Cricketers Academy.html` | Home — full-bleed photo hero, the difference, programs, U10–U19 team record, international tours band, getting started, photo band, testimonial, CTA |
| `Programs.html` | Foundation (6–9) / Age-Group Squads (U10–U19, with UAE-circuit standings) / Girls' Cricket — tabbed |
| `Coaches.html` | Head coach **Ajith Weerakkody** (Sri Lanka international, ICC Global Level 3) — full profile, playing & coaching career, the 13-strong coaching team, standards |
| `Tours.html` | **International tours** — annual tours (India 2022 & 2023; UK & Sri Lanka next), academy residencies abroad, tour gallery, selection, tour partners |
| `About.html` | Club history (est. late 1980s), Dubai Cricket Council registration, ECB & India associations, role-model visits, philosophy, the Shabab Al Ahli facility |
| `Contact.html` | Validated enquiry form (incl. tours & sponsorship), contact details, map placeholder |
| `index.html` | Redirect to the home page so `/` works when served |

## How the home page works

- **Three.js** (`assets/story.js`) paints a subtle, cursor-reactive textured backdrop whose
  colours follow the active section (light sections vs dark photographic bands).
- **GSAP + ScrollTrigger** reveal sections on scroll and drive photo parallax.
- **Lenis** provides smooth scrolling, wired into the GSAP ticker.
- **Splitting.js** brings the hero headline in letter by letter on load.
- Degrades gracefully: CSS-gradient fallback without WebGL, fully static under
  `prefers-reduced-motion`, and content stays visible if JS or a CDN fails.

Inner pages are plain HTML/CSS with light interactions (`assets/site.js`: tabs, accordion,
form validation, reveal-on-scroll).

## Project structure

```
Cricketers Academy.html      ← home
Programs.html / Coaches.html / Tours.html / About.html / Contact.html
index.html                   ← redirect to home
assets/
  site.css                   ← design tokens + shared components
  site.js                    ← inner-page interactions
  story.css                  ← home-specific styles
  story.js                   ← Three.js / GSAP / Lenis / Splitting orchestration
  img/                       ← academy photography (training, squads, tours, coach,
                               club crest, stadium) — sourced from the club's portfolio
```

## Running it

Static site, no build step. Serve over HTTP (CDN libraries + relative paths need a real
origin, not `file://`):

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

External libraries via CDN: Three r158, GSAP 3.12.5 + ScrollTrigger, Lenis 1.0.42,
Splitting 1.0.6, Tabler Icons, General Sans (Fontshare).

## Facts on the site

From the club's portfolio and coach profile: established late 1980s; registered under the
Dubai Cricket Council; works with the Emirates Cricket Board and Indian state associations;
275+ players (≈250 boys, ≈25 girls) aged 6–20; ten squads U10–U19; ~30 competitive matches
a season; 13 coaches; sessions daily except Mondays; international tours every year
(India 2022 & 2023, UK & Sri Lanka next) plus annual residencies at leading academies
worldwide; head coach Ajith Weerakkody (Sri Lanka 1994 Austral-Asia Cup, ICC Global L3).

Contact: Shabab Al Ahli Club, Al Nahda, Dubai · +971 50 5657811 ·
tellicherry.cricket@gmail.com · Instagram @tellicherry_cricket_academy
