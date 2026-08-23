# IVE.DEV — Design System (WP2)

Internal reference. Every page and section must comply with this document.
Product truth comes from `_reference-old-site-copy.txt` and the Product truth
block in `README.md`. No capability may be shown that is absent from those.

---

## Brand idea

**Run agents. Keep control.**

IVE is the local control room for parallel coding work. The website presents a
controlled run, not a collection of features: one request is routed into real
sessions, executed in view, held at verification gates, and returned as proof.

The language is hybrid. “Humanity’s Last IDE” is a small legacy brand line used
only in the hero eyebrow and footer wordmark. It is never a headline or product
claim. The final invitation remains “Stop switching tabs. Start commanding
agents.”

No character, avatar, robot, employee, personality, or workforce metaphor is
used. Commander is a product control, not a persona.

## Visual thesis

**A run ledger that crosses the whole site.**

The five phases are the structural grammar:

`REQUEST → ROUTE → EXECUTE → VERIFY → PROOF`

The mono eyebrow in each main section carries its phase and names that
section's role in the run. The phases stay embedded in the information
hierarchy instead of occupying a separate viewport control.

The hero’s right column is a truthful, complete run ledger with real session
IDs, supported model labels, the status glyph vocabulary, a failed test gate,
and a resolved proof state. This is the primary product expression; it is not
an image.

The end-to-end run retains the scroll-driven branch / execute / verify / merge
story. Its no-JavaScript and reduced-motion form is the fully expanded final
state.

---

## Typography

| Role | Face | Notes |
|---|---|---|
| Display | **Inter** (400–800) | H1, H2, concise product headlines, and wordmark. Weight 620, balanced wrapping, tight tracking, and leading at or above 1.01. |
| Body | **Inter** (400–800) | All explanatory and marketing copy. 16–18px, generous leading, ~64ch maximum. |
| Machine | **IBM Plex Mono** (400/500/600) | Terminals, session IDs, statuses, metadata, eyebrows, keyboard keys, install commands, ledgers. |

Rules:

- Inter carries both the editorial and display voices; the separate tokens keep
  those roles independently adjustable.
- Machine voice is IBM Plex Mono. Terminal output is never proportional.
- The H1 is the largest expression. Chapters step down from it.
- The size ladder is hero 42–66px, chapter 32–46px, statement 28–40px,
  use-case and section titles 22–30px, card titles 17–19px, and body 16–18px.
- Headlines use weight 620, negative tracking from -0.045em at the largest size
  toward -0.02em at the smallest, balanced wrapping, and 1.01–1.15 leading.
- Section eyebrows use IBM Plex Mono at 11px/500, 0.13em tracking, and uppercase
  text; they encode run state.

## Color

Light is primary and the default. Dark graphite is an explicit alternate stored
by the theme toggle. Component rules do not branch on `[data-theme]`; theme
differences belong in tokens.

```text
LIGHT
--bg          #F3F7F5
--bg-raised   #FFFFFF
--bg-inset    #E9EFEC
--bg-glass    rgba(243, 247, 245, 0.82)
--line        #D5DFDB
--line-strong #B4C3BD
--text        #071611
--text-dim    #40544D
--text-faint  #5E706A
```

Semantic colors split marks from readable ink:

```text
--running       #FFB000   --running-ink   #8A5200
--complete      #087A4B   --complete-ink  #066B41
--waiting       #8FA09A   --waiting-ink   #566661
--attention     #C83B24   --attention-ink #A82F1B
--route         #1647FF   --route-ink     #0E36C7
--focus         #1647FF
```

```text
DARK
--bg #101012 · --bg-raised #17171A · --bg-inset #0B0B0D
--bg-glass rgba(16, 16, 18, 0.82)
--line #26262B · --line-strong #34343B
--text #EDEDE9 · --text-dim #A3A39E · --text-faint #85857F
--running / --running-ink #FFB454
--complete / --complete-ink #7DCE82
--waiting / --waiting-ink #8A8A93
--attention / --attention-ink #F2545B
--route / --route-ink #6BB6C9 · --focus #FFB454
```

The review-and-intervention section is the single opposite-ground moment and
uses only inversion tokens. Terminals remain on the primary theme ground.

The primary CTA is always an ink block with field text:

```css
.btn-primary { background: var(--text); color: var(--bg); }
.btn-primary:hover { background: var(--text-dim); }
```

Rules:

- Amber is earned by live/running marks only.
- No gradients, glow/blur shadows, purple, or decorative saturation.
- The focus ring remains visible on every interactive control.

## Status language

```text
○ queued   ◐ thinking   ● running   ◇ waiting   ✓ complete   ! attention
```

Use IBM Plex Mono. Pair a symbol with a word at first use. The symbol must still
communicate without color.

## Layout

- Twelve-column fluid grid, 1480px maximum content width, 8px base spacing.
- Strongly left aligned and deliberately asymmetric.
- Run phases are carried by section eyebrows and reserve no viewport edge or
  content column.
- Raw page plus hairline rules is the default surface.
- Panels are reserved for product UI: terminals, session tiles, board columns,
  run ledgers, and generated briefings.
- Marketing copy never sits in a card.
- Section rhythm stays uneven: thesis → counted proof → open problem → dense run
  → four pillars → calm architecture → inverted review → technical evidence →
  simple final action.

## Information architecture

The homepage contains exactly these blocks, in order:

1. Header
2. Hero: the controlled run
3. Provable proof strip
4. The control gap
5. End-to-end run
6. Four product pillars
7. Architecture
8. Review and intervention
9. Compatibility
10. Security and deployment
11. Open-source evidence
12. Three use cases
13. Final CTA

Every main section carries one visible phase eyebrow from the five-phase run.

## Radius and surface

- Product panels and terminals: 8px.
- Small chips and keys: 4px. Buttons: 6px.
- Nothing pill-shaped.
- Terminals use `--bg-inset`, a 1px line, and 13px mono output.
- No fake macOS chrome.

## Motion

Grammar: **Branch → Execute → Verify → Proof.**

- The end-to-end run uses CSS transforms with vanilla JavaScript.
- Ambient changes are sparse and product-relevant.
- `prefers-reduced-motion` removes ambient and scroll animation, expands the run
  to its final state.
- With JavaScript disabled all content and the final run state remain readable.

## Voice

- Technical, confident, direct. Short declarative sentences.
- Benefit first, mechanism second, implementation detail in small mono.
- Describe controls and proof states, not personalities.
- Compatibility copy says what is supported today. Anything else is explicitly
  labeled roadmap.
- No corporate filler, meme voice, grandiosity, or workforce metaphor.

## Honesty constraints

- Alpha status and Apache-2.0 are stated plainly.
- Anonymous opt-out telemetry is stated plainly.
- Supported CLIs: Claude Code and Gemini CLI only.
- Supported models: Haiku, Sonnet, Opus, Gemini Pro, and Flash only.
- Allowed totals: 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event
  types, 20 RALPH iterations maximum, 8,000+ skills, 6 board columns, 9 package
  scan steps, 3 access modes, and 4 memory types.
- Numeric product totals sit beside the visible source line: “Alpha snapshot ·
  counted in github.com/vibe2vibe/ive”.
- No customer claims, social proof, release dates, version numbers, OS matrix,
  unverified metrics, or unsupported integrations.

## Anti-patterns (hard bans)

- Purple/violet, neon cyan+magenta, glows, star fields, orbs, sparkle icons.
- Matrix green, hacker cosplay, ASCII art as decoration.
- Cards for everything; icon-grid feature walls; decorative bento layouts.
- Generic node graphs, neural imagery, robot/AI-head illustrations.
- Character, avatar, robot, employee, personality, or workforce metaphors.
- Fake macOS chrome, fake customers, fake numbers, fake code.
- Custom cursors, WebGL, animation libraries, autoplay video.
- Warm-cream + serif + terracotta; black + acid-green; broadsheet templates.
- Looking like Cursor, Linear, Zed, Raycast, or Warp.
- Retired brand line: “One brain. Infinite&#32;hands.”
- Retired collaboration wording: “agent&#32;army” / “agent&#32;armies”.
- Retired session line: “tmux wish&#101;s it could do this.”
