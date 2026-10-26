/**
 * The promo film (RSI_Homepage/promo, 1:46, 1080p60), narrated in English, with subtitles in English
 * and Chinese (film-cues.json; the same cues as WebVTT next to the MP4). The film was also voiced in
 * Chinese; the page keeps the English one only.
 * The MP4 lives in public/film/ and is served next to the page; the single-file build links to the
 * published copy instead of embedding it.
 */
import CUES from './film-cues.json';
import POSTER from '../assets/film/poster-en.webp';
const THUMBS = import.meta.glob<string>('../assets/film/ch*-en.webp', { eager: true, import: 'default' });

/** where the page is published (GitHub Pages) */
export const SITE_URL = 'https://trinity-rsi.github.io/';
const BASE = import.meta.env.MODE === 'single' ? SITE_URL : import.meta.env.BASE_URL;

export const FILM = {
  duration: 106.38,
  src: `${BASE}film/the-trinity-en.mp4`,
  poster: POSTER,
  captions: `${BASE}film/the-trinity-en-zh.vtt`,
  sizeMB: 23,
};

/** subtitle cues, timed to the English voice: [start, end, English, Chinese], in seconds */
export type Cue = [number, number, string, string];
export const FILM_CUES = CUES as Cue[];
export const cueAt = (t: number) => FILM_CUES.find((c) => t >= c[0] && t < c[1]) ?? null;

/** chapters in the film's order (scene starts of promo/src/timeline.tsx, in film time), each tied to a section of the page */
export const CHAPTERS: { t: number; title: string; section: string }[] = [
  { t: 0, title: 'Position', section: 'top' },
  { t: 6.95, title: 'The problem', section: 'problem' },
  { t: 18.86, title: 'Shared capabilities', section: 'examples' },
  { t: 33.72, title: 'The Trinity', section: 'trinity' },
  { t: 44.94, title: 'Stage 1 · Task tree', section: 'stage-1' },
  { t: 54.3, title: 'Stage 2 · Capability tree', section: 'stage-2' },
  { t: 66.62, title: 'Stage 3 · Harness tree', section: 'stage-3' },
  { t: 82.18, title: 'Routing a new task', section: 'router' },
  { t: 92.54, title: 'Results', section: 'results' },
];
export const chapterThumb = (i: number) => THUMBS[`../assets/film/ch${i}-en.webp`];
export const chapterAt = (time: number) => {
  let k = 0;
  CHAPTERS.forEach((c, i) => {
    if (time >= c.t - 0.05) k = i;
  });
  return k;
};
export const chapterEnd = (i: number) => (i < CHAPTERS.length - 1 ? CHAPTERS[i + 1].t : FILM.duration);

/** the hero's "Watch the film" button asks the film section to scroll into view and play */
export const FILM_EVENT = 'trinity:film';
export const playFilm = () => window.dispatchEvent(new CustomEvent(FILM_EVENT));

export const fmtTime = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
};
