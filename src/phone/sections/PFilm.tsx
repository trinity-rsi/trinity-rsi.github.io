import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { ClosedCaptionIcon, Download04Icon, FullScreenIcon, PauseIcon, PlayIcon, RepeatIcon } from '@hugeicons/core-free-icons';
import FilmSubtitles, { SubtitleHint } from '@/components/ui/FilmSubtitles';
import { CHAPTERS, FILM, FILM_EVENT, chapterAt, chapterEnd, chapterThumb, cueAt, fmtTime } from '@/data/film';
import { useReducedMotion } from '@/lib/hooks';
import { Opener } from '../ui/Opener';
import { goTo } from '../chapters';

/**
 * The film on a phone: the picture, its subtitles (English over Chinese) in a strip underneath,
 * never over the picture, and the chapters as a row to swipe through. A tap on the picture shows
 * or hides the controls; full screen hands over to the phone's own player, which shows the
 * subtitles itself.
 */
const CC_KEY = 'trinity-film-cc';
const SINGLE = import.meta.env.MODE === 'single';

const stored = <T,>(key: string, ok: (v: string) => T | null, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    const r = v === null ? null : ok(v);
    return r ?? fallback;
  } catch {
    return fallback;
  }
};
const remember = (key: string, v: string) => {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* private mode */
  }
};

export default function PFilm() {
  const reduce = useReducedMotion();
  const [cc, setCc] = useState(() => stored(CC_KEY, (v) => v !== '0', true));
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [shown, setShown] = useState(true);
  const [scrub, setScrub] = useState(false);
  const idle = useRef(0);
  const D = FILM.duration;

  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    setEnded(false);
    v.play().catch(() => undefined);
  }, []);
  const seek = (s: number, andPlay = false) => {
    const v = videoRef.current;
    if (!v) return;
    const to = Math.max(0, Math.min(D - 0.05, s));
    v.currentTime = to;
    setTime(to);
    setEnded(false);
    if (andPlay) play();
  };
  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) play();
    else v.pause();
  };

  // controls fade after a moment while the film plays
  const wake = useCallback(() => {
    setShown(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setShown(false), 2800);
  }, []);
  useEffect(() => {
    if (!playing) {
      window.clearTimeout(idle.current);
      setShown(true);
    } else wake();
    return () => window.clearTimeout(idle.current);
  }, [playing, wake]);

  // the video's own events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const on: Record<string, () => void> = {
      play: () => setPlaying(true),
      playing: () => setWaiting(false),
      pause: () => setPlaying(false),
      ended: () => {
        setPlaying(false);
        setEnded(true);
      },
      waiting: () => setWaiting(true),
      canplay: () => setWaiting(false),
      timeupdate: () => setTime(v.currentTime),
      progress: () => {
        const b = v.buffered;
        let end = 0;
        for (let i = 0; i < b.length; i++) if (b.start(i) <= v.currentTime + 0.5) end = Math.max(end, b.end(i));
        setBuffered(end);
      },
    };
    Object.entries(on).forEach(([k, f]) => v.addEventListener(k, f));
    return () => Object.entries(on).forEach(([k, f]) => v.removeEventListener(k, f));
  }, []);
  // a smooth clock while playing
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) setTime(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // the hero's "Watch the film": bring the player into view and start it (still inside the tap, so phones allow sound)
  useEffect(() => {
    const on = () => {
      const box = boxRef.current;
      if (box) {
        const r = box.getBoundingClientRect();
        window.scrollTo({ top: Math.max(0, r.top + window.scrollY - Math.max(70, (window.innerHeight - r.height) / 2 - 30)), behavior: reduce ? 'auto' : 'smooth' });
      }
      play();
    };
    window.addEventListener(FILM_EVENT, on);
    return () => window.removeEventListener(FILM_EVENT, on);
  }, [play, reduce]);

  // subtitles: drawn in the strip; the phone's own full screen shows the WebVTT track instead
  const setCaptions = (on: boolean) => {
    setCc(on);
    remember(CC_KEY, on ? '1' : '0');
  };
  useEffect(() => {
    const v = videoRef.current as (HTMLVideoElement & { webkitDisplayingFullscreen?: boolean }) | null;
    if (!v) return;
    const sync = () => {
      const tr = v.textTracks?.[0];
      if (tr) tr.mode = cc && (v.webkitDisplayingFullscreen || document.fullscreenElement === v) ? 'showing' : 'hidden';
    };
    sync();
    v.addEventListener('webkitbeginfullscreen', sync);
    v.addEventListener('webkitendfullscreen', sync);
    document.addEventListener('fullscreenchange', sync);
    v.textTracks?.addEventListener?.('addtrack', sync);
    return () => {
      v.removeEventListener('webkitbeginfullscreen', sync);
      v.removeEventListener('webkitendfullscreen', sync);
      document.removeEventListener('fullscreenchange', sync);
      v.textTracks?.removeEventListener?.('addtrack', sync);
    };
  }, [cc]);
  const fullScreen = () => {
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    if (!started) play();
    if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    else v.requestFullscreen?.().catch(() => undefined);
  };

  // the scrubber
  const tAt = (x: number) => {
    const r = barRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - r.left) / r.width)) * D;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrub(true);
    seek(tAt(e.clientX));
    wake();
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!scrub) return;
    seek(tAt(e.clientX));
    wake();
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setScrub(false);
  };

  const cur = chapterAt(time);
  const cue = started ? cueAt(time) : null;
  const controls = started && !ended && (shown || !playing || scrub);

  // keep the chapter being played in view in the row (unless the reader is browsing it)
  const browsing = useRef(0);
  useEffect(() => {
    if (!playing || performance.now() - browsing.current < 4000) return;
    const list = listRef.current;
    const item = list?.children[cur] as HTMLElement | undefined;
    if (!list || !item) return;
    const left = item.offsetLeft - (list.clientWidth - item.clientWidth) / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [cur, playing]);

  return (
    <section id="film" className="scroll-mt-16 pt-20">
      <Opener kicker="The film" title="The Trinity in under two minutes" aside={<span className="tabular rounded-full bg-paper-2 px-2.5 py-1 text-[12.5px] font-[700] text-ink-2">{fmtTime(D)}</span>}>
        <p className="p-lede">The whole argument in the order of this page, narrated in English, with subtitles in English and Chinese.</p>
      </Opener>

      <div className="mt-3 px-5">
        <a href={FILM.src} download target="_blank" rel="noreferrer" className="p-press -ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-[13.5px] font-[680] text-ink-2">
          <Icon icon={Download04Icon} size={16} stroke={1.9} />
          MP4, {FILM.sizeMB} MB
        </a>
      </div>

      <div className="mt-2 px-3">
        <div ref={boxRef} className="overflow-hidden rounded-[22px] border border-rule bg-surface shadow-[0_30px_60px_-40px_rgba(20,24,40,0.6)]">
          <div className="relative aspect-video bg-[#f3f4f7]">
            <video
              ref={videoRef}
              src={FILM.src}
              poster={FILM.poster}
              preload="none"
              playsInline
              crossOrigin={SINGLE ? 'anonymous' : undefined}
              className="absolute inset-0 h-full w-full object-contain"
              onClick={() => (started && !ended ? (playing && shown ? setShown(false) : wake()) : play())}
              aria-label="The Trinity, the film"
            >
              <track kind="subtitles" srcLang="en" label="English and 中文" src={FILM.captions} />
            </video>

            {/* before the first play, and at the end */}
            <AnimatePresence>
              {(!started || ended) && (
                <motion.div
                  key={ended ? 'end' : 'start'}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                  <img src={FILM.poster} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                  <span className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_55%,rgba(10,12,20,0.18),transparent_70%)]" aria-hidden />
                  {/* the play button sits in a corner, so the poster's title stays readable */}
                  <button type="button" onClick={() => (ended ? seek(0, true) : play())} className="absolute inset-0" aria-label={ended ? 'Watch again' : 'Play the film'}>
                    <span className="p-press absolute bottom-3 left-3 flex items-center gap-2.5 rounded-full bg-[rgba(12,14,22,0.66)] py-1.5 pl-1.5 pr-4 text-white shadow-[0_14px_30px_-12px_rgba(10,12,20,0.7)] backdrop-blur-md">
                      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-accent">
                        {!reduce && !ended && <span className="p-ring absolute inset-0 rounded-full" aria-hidden />}
                        <Icon icon={ended ? RepeatIcon : PlayIcon} size={16} stroke={2.5} className={ended ? '' : 'translate-x-[1px]'} />
                      </span>
                      <span className="text-[14.5px] font-[740]">{ended ? 'Watch again' : 'Play'}</span>
                      <span className="tabular text-[12.5px] font-[600] text-white/70">{fmtTime(D)}</span>
                    </span>
                  </button>
                  {ended && (
                    <button type="button" onClick={() => goTo('problem')} className="p-press absolute bottom-3.5 right-3 rounded-full bg-white/92 px-3.5 py-2 text-[13px] font-[720] text-[#12141c] shadow-lg">
                      Read on
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {started && playing && waiting && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/40 border-t-white" aria-hidden />
            )}

            {/* controls */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${controls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              onClick={(e) => {
                // a tap beside the buttons: hide the controls while playing, play when paused
                if (e.target !== e.currentTarget) return;
                if (playing) setShown(false);
                else toggle();
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(10,12,20,0.7),rgba(10,12,20,0.08)_55%,rgba(10,12,20,0.18))]" aria-hidden />
              <button
                type="button"
                onClick={() => {
                  toggle();
                  wake();
                }}
                className="p-press absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(12,14,22,0.5)] text-white backdrop-blur-md"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                <Icon icon={playing ? PauseIcon : PlayIcon} size={24} stroke={2.2} className={playing ? '' : 'translate-x-[2px]'} />
              </button>
              <div className="absolute inset-x-0 bottom-0 px-3 pb-1.5">
                <div
                  ref={barRef}
                  className="relative flex h-7 touch-none items-center gap-[3px]"
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                  role="slider"
                  aria-label="Seek"
                  aria-valuemin={0}
                  aria-valuemax={Math.round(D)}
                  aria-valuenow={Math.round(time)}
                  aria-valuetext={`${fmtTime(time)} of ${fmtTime(D)}, ${CHAPTERS[cur].title}`}
                >
                  {CHAPTERS.map((c, i) => {
                    const a = c.t;
                    const b = chapterEnd(i);
                    const played = Math.max(0, Math.min(1, (time - a) / (b - a)));
                    const loaded = Math.max(0, Math.min(1, (buffered - a) / (b - a)));
                    return (
                      <span key={i} className={`relative overflow-hidden rounded-full bg-white/28 transition-[height] duration-200 ${scrub ? 'h-[7px]' : 'h-[4px]'}`} style={{ flexGrow: b - a, flexBasis: 0 }}>
                        <span className="absolute inset-y-0 left-0 bg-white/35" style={{ width: `${loaded * 100}%` }} />
                        <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${played * 100}%` }} />
                      </span>
                    );
                  })}
                  <span
                    className={`pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(200,16,46,0.45)] transition-transform duration-200 ${scrub ? 'scale-100' : 'scale-75'}`}
                    style={{ left: `${(time / D) * 100}%` }}
                    aria-hidden
                  />
                  {scrub && (
                    <span className="pointer-events-none absolute bottom-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[rgba(12,14,22,0.82)] px-2 py-1 text-[11.5px] font-[700] text-white" style={{ left: `clamp(60px, ${(time / D) * 100}%, calc(100% - 60px))` }}>
                      {CHAPTERS[cur].title} <span className="tabular font-[600] text-white/70">{fmtTime(time)}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-white">
                  <span className="tabular pl-0.5 text-[12px] font-[680] text-white/90">
                    {fmtTime(time)} <span className="text-white/55">/ {fmtTime(D)}</span>
                  </span>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setCaptions(!cc);
                      wake();
                    }}
                    aria-pressed={cc}
                    className={`relative grid h-9 w-9 place-items-center rounded-full ${cc ? 'text-white' : 'text-white/55'}`}
                    aria-label={cc ? 'Hide subtitles' : 'Show subtitles'}
                  >
                    <Icon icon={ClosedCaptionIcon} size={19} stroke={2} />
                    <span className={`absolute bottom-[6px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-accent transition-all duration-300 ${cc ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} aria-hidden />
                  </button>
                  <button type="button" onClick={fullScreen} className="grid h-9 w-9 place-items-center rounded-full" aria-label="Full screen">
                    <Icon icon={FullScreenIcon} size={18} stroke={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* subtitles, under the picture */}
          <AnimatePresence initial={false}>
            {cc && (
              <motion.div key="cc" className="overflow-hidden border-t border-rule" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}>
                <FilmSubtitles cue={cue} size="phone" hint={!started && <SubtitleHint small />} className="min-h-[64px] px-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* chapters */}
      <div className="mt-6">
        <p className="px-5 text-[14px] font-[720] text-ink">Chapters</p>
        <ol
          ref={listRef}
          className="p-noscroll mt-2.5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2"
          onTouchStart={() => (browsing.current = performance.now())}
          onScroll={() => (browsing.current = performance.now())}
        >
          {CHAPTERS.map((c, i) => {
            const on = started && i === cur;
            const k = Math.max(0, Math.min(1, (time - c.t) / (chapterEnd(i) - c.t)));
            return (
              <li key={i} className="w-[150px] shrink-0 snap-start">
                <button type="button" onClick={() => seek(c.t + 0.01, true)} className="p-press block w-full text-left" aria-current={on ? 'true' : undefined}>
                  <span className={`relative block aspect-video overflow-hidden rounded-[12px] bg-paper-2 ring-offset-2 ring-offset-paper transition-shadow ${on ? 'ring-2 ring-accent' : 'ring-1 ring-rule'}`}>
                    <img src={chapterThumb(i)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" draggable={false} />
                    {on && (
                      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-black/25" aria-hidden>
                        <span className="block h-full bg-accent" style={{ width: `${k * 100}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="tabular mt-2 flex items-baseline gap-2 text-[11.5px] font-[700] text-ink-3">
                    <span className={on ? 'text-accent' : ''}>{String(i + 1).padStart(2, '0')}</span>
                    {fmtTime(c.t)}
                  </span>
                  <span className={`mt-0.5 line-clamp-2 block text-[13.5px] font-[700] leading-snug ${on ? 'text-ink' : 'text-ink-2'}`}>{c.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
