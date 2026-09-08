# ive.dev

Static source for the IVE product site: a local control room for parallel coding work. There is no build step or framework.

## Preview

From this folder, run:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`. The pages also work directly from `file://`.

## File map

- `index.html` — 10-block homepage: the IVE mark unfolds into “Integrated Vibecoding Environment”, then GOAL → PLAN → WORK → CHECK → REVIEW
- `architecture.html` — engineering architecture page using the same design system
- `imprint.html` and `privacy.html` — legal provider information and site-specific privacy notice
- `404.html` — self-contained not-found page
- `styles.css` — shared design system and page styles
- `script.js` — dependency-free theme, scroll-driven mark, run-story, use-case chooser, and copy behavior
- `assets/og.html` — 1200×630 Open Graph image source
- `assets/fonts.css` and `assets/fonts/` — self-hosted Archivo, Source Sans 3 and IBM Plex Mono, including OFL license texts
- `DESIGN.md` — binding visual and interaction contract
- `_reference-old-site-copy.txt` — product capability truth source

## Open Graph image

Serve the folder, open `assets/og.html` in a browser at exactly 1200×630, and capture the viewport to `assets/og.png`. The HTML is the editable source; do not hand-edit the PNG.

## Product truth

- The only public repository is `github.com/vibe2vibe/ive`.
- The license is Apache-2.0. IVE is an alpha with anonymous, opt-out telemetry.
- Supported integrations are Claude Code and Gemini CLI. Supported models are Haiku, Sonnet, Opus, Gemini Pro, and Flash.
- Additional CLIs or models may appear only as explicitly labeled roadmap items, never as current support.
- Use only documented totals: 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event types, 20 RALPH iterations maximum, 8,000+ skills, a 6-column board, a 9-step package scan, 3 access modes, and 4 memory types.
- Do not add social proof, customer claims, star counts, integrations, models, metrics, or capabilities that are absent from the product-truth source.
