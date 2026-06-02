# Cricketers Academy

A cinematic, scroll-driven storytelling site for **Cricketers Academy** (by Tellicherry
Cricket Club), Dubai. Built from the Claude Design handoff bundle and reimagined as an
immersive single-page story.

## The experience

The home page (`Cricketers Academy.html`) is told as **eight chapters**. As you scroll,
each chapter animates in as its own cinematic scene and the painted background shifts
through a fluid sequence of colours:

| # | Chapter | Theme |
|---|---------|-------|
| 00 | The opening (hero) | charcoal + lime |
| 01 | The difference | deep teal-green |
| 02 | The pathway (programs) | warm olive |
| 03 | On the field (teams & record) | near-black, lime peak |
| 04 | The journey (how it works) | warm stone |
| 05 | Inside the academy (gallery) | cool ink |
| 06 | Voices (testimonial) | deep aubergine |
| 07 | The invitation (trial CTA) | green-black |

### How it's built

- **Three.js** — a full-screen GLSL shader paints a flowing, marbled texture that
  **reacts to the cursor**: the paint flows toward the pointer and a soft accent light
  follows it. The two shader colours are tweened per chapter, which is what produces the
  fluid colour transitions.
- **GSAP + ScrollTrigger** — every chapter animates in as a cinematic scene (staggered
  reveals, split-text titles, photo parallax), and per-chapter triggers drive the
  background colour changes and the side chapter rail.
- **Lenis** — buttery smooth scrolling, wired into the GSAP ticker so ScrollTrigger and
  the WebGL render share a single clock.
- **Splitting.js** — the hero title arrives **letter by letter** on load (and chapter
  titles split into words that rise into place on scroll-in).

### Graceful degradation

- **No WebGL?** The background falls back to an animated CSS gradient that still shifts
  colour per chapter.
- **`prefers-reduced-motion`?** Smooth scroll, the shader, and the reveal animations are
  all disabled; all content renders immediately and statically.
- **No JavaScript / a CDN fails?** An inline guard keeps every section fully visible
  (the hidden "ready to animate" states are only applied when motion + JS are available).

## Project structure

```
Cricketers Academy.html   ← the storytelling home (Three.js + GSAP + Lenis + Splitting)
index.html                ← redirect to the home (so "/" works when served)
Programs.html             ← inner pages (carried over from the design, shared site.css/js)
Coaches.html
About.html
Contact.html
assets/
  site.css                ← shared design tokens + base components (lime / black / cream)
  site.js                 ← interactions for the inner pages (tabs, accordion, carousel, form)
  story.css               ← storytelling-specific styles for the home
  story.js                ← Three.js / GSAP / Lenis / Splitting orchestration
  img/ca1–ca4.webp        ← academy photography
```

## Running it

It's a static site — no build step. Serve the folder over HTTP (the CDN libraries and
relative asset paths need a real origin, not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

External libraries are loaded from CDN (Three r158, GSAP 3.12.5 + ScrollTrigger, Lenis
1.0.42, Splitting 1.0.6, Tabler Icons), so an internet connection is required.

## Notes

Copy, photography, palette, and the academy's real details (ages 6–20, ~275 players,
ten U10–U19 squads, top-4 UAE academy, central Dubai, sessions daily except Mondays) come
from the design handoff. Bracketed items in the inner pages (founding year, address,
phone, coach names) remain placeholders pending real information.
