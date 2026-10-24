# The Trinity: project page

Project page for **The Trinity: Capability-Driven Recursive Self-Improvement for Multimodal Agents** (technical report, October 2026).

- Live page: https://mikeeeeeeeeeeeeee.github.io/Trinity/
- Film (1:46, 1080p60, narrated, with subtitles): [English](https://mikeeeeeeeeeeeeee.github.io/Trinity/film/the-trinity-en.mp4) · [中文](https://mikeeeeeeeeeeeeee.github.io/Trinity/film/the-trinity-zh.mp4) · subtitles [en](https://mikeeeeeeeeeeeeee.github.io/Trinity/film/the-trinity-en.vtt) / [zh](https://mikeeeeeeeeeeeeee.github.io/Trinity/film/the-trinity-zh.vtt)

React 19 + Vite + Tailwind CSS v4, with effects and components from [React Bits](https://reactbits.dev).
The page opens in the light theme; the switch in the top-right corner turns on the dark theme and is remembered.

## Run and build

```bash
npm ci
npm run dev            # local preview
npm run build          # dist/: the static site (relative paths, works under any sub-path)
npm run build:single   # dist-single/index.html: one self-contained file that opens by double-click
```

Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`).
Fonts, images and the film are served from the site itself; nothing is loaded from a third-party CDN.
The single-file build links to the published film instead of embedding it.

## Where things are

| Path | Content |
| --- | --- |
| `src/data/paper.ts` | title, authors, affiliations, abstract, BibTeX, and the Paper / Code / Hugging Face links (`LINKS`, still empty) |
| `src/data/tree.ts` | the 44 benchmarks, 5 domains and 15 task families, the six capabilities and eleven nodes, modules M01–M28 and every score (Appendix A–D, Table 7) |
| `src/data/results.ts` | Figures 4 and 6, Tables 2–5 and the paper's findings |
| `src/data/media.ts` | frames and figures taken from the paper (`src/assets/paper/`) |
| `src/data/film.ts`, `src/data/film-cues.json` | the film's files, posters, chapters and subtitles (`public/film/`, `src/assets/film/`) |
| `src/sections/` | the page, section by section, in the order of the paper |
| `src/components/viz/` | the interactive figures (the three roles, example pairs, task tree → capability tree, the Harness in bricks, Harness tree, Creator library, Router, results); `Bricks.tsx` draws the film's LEGO bricks |
| `src/components/reactbits/` | React Bits component sources, with a few local patches |

Every number on the page comes from the paper; edit `src/data/` to update the whole page at once.
