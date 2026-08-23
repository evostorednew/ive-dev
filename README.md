# ive.dev

Static source for the IVE product site: a local control room for parallel coding work. There is no build step or framework.

## Preview

From this folder, run:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`. The pages also work directly from `file://`.

## File map

- `index.html` — 13-block homepage organized as REQUEST → ROUTE → EXECUTE → VERIFY → PROOF
- `architecture.html` — engineering architecture page using the same run-phase rail
- `404.html` — self-contained not-found page
- `styles.css` — shared design system and page styles
- `script.js` — dependency-free theme, phase-rail, run-story, and copy behavior
- `assets/og.html` — 1200×630 Open Graph image source
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
