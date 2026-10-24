/**
 * The promo film (RSI_Homepage/promo, 86 s, 1080p60, English and Chinese).
 * The MP4s live in public/film/ and are served next to the page; the single-file build links to
 * the published copies instead of embedding them.
 */
const POSTERS = import.meta.glob<string>('../assets/film/poster-*.webp', { eager: true, import: 'default' });
const THUMBS = import.meta.glob<string>('../assets/film/ch*-*.webp', { eager: true, import: 'default' });

export type FilmLang = 'en' | 'zh';

/** where the page is published (GitHub Pages) */
export const SITE_URL = 'https://mikeeeeeeeeeeeeee.github.io/Trinity/';
const BASE = import.meta.env.MODE === 'single' ? SITE_URL : import.meta.env.BASE_URL;

export const FILM = {
  duration: 86,
  src: { en: `${BASE}film/the-trinity-en.mp4`, zh: `${BASE}film/the-trinity-zh.mp4` } as Record<FilmLang, string>,
  poster: { en: POSTERS['../assets/film/poster-en.webp'], zh: POSTERS['../assets/film/poster-zh.webp'] } as Record<FilmLang, string>,
  langName: { en: 'English', zh: '中文' } as Record<FilmLang, string>,
};

/** chapters in the film's order (scene starts from promo/src/timeline.tsx), each tied to a section of the page */
export const CHAPTERS: { t: number; en: string; zh: string; section: string }[] = [
  { t: 0, en: 'Position', zh: '观点', section: 'top' },
  { t: 6.2, en: 'The problem', zh: '问题', section: 'problem' },
  { t: 15.2, en: 'Shared capabilities', zh: '共享的能力', section: 'examples' },
  { t: 25.9, en: 'The Trinity', zh: '三个角色', section: 'trinity' },
  { t: 35.3, en: 'Stage 1 · Task tree', zh: '阶段 1 · 任务树', section: 'stage-1' },
  { t: 42.9, en: 'Stage 2 · Capability tree', zh: '阶段 2 · 能力树', section: 'stage-2' },
  { t: 52.1, en: 'Stage 3 · Harness tree', zh: '阶段 3 · Harness 树', section: 'stage-3' },
  { t: 66.2, en: 'Routing a new task', zh: '路由新任务', section: 'router' },
  { t: 75.0, en: 'Results', zh: '结果', section: 'results' },
];
export const chapterThumb = (i: number, lang: FilmLang) => THUMBS[`../assets/film/ch${i}-${lang}.webp`];
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
