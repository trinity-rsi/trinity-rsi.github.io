import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { Container, Section } from '@/components/ui/Section';
import SplitText from '@/components/reactbits/SplitText/SplitText';
import FilmSubtitles, { SubtitleHint } from '@/components/ui/FilmSubtitles';
import { CHAPTERS, FILM, FILM_EVENT, chapterAt, chapterEnd, chapterThumb, cueAt, fmtTime } from '@/data/film';
import { scrollToId, useReducedMotion } from '@/lib/hooks';
import { ArrowDown01Icon, ClosedCaptionIcon, Download04Icon, FullScreenIcon, Minimize01Icon, PauseIcon, PlayIcon, RepeatIcon, VolumeHighIcon, VolumeMute02Icon } from '@hugeicons/core-free-icons';

/**
 * The film, narrated in English, with chapters that follow the order of this page and subtitles in
 * English and Chinese in a strip of their own under the picture, so they never cover it.
 * The video is streamed from the site (public/film); nothing is fetched until it is played.
 */
const CC_KEY = 'trinity-film-cc';
const SINGLE = import.meta.env.MODE === 'single';

function initialCC() {
  try {
    return localStorage.getItem(CC_KEY) !== '0';
  } catch {
    return true;
  }
}

export default function FilmSection() {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [full, setFull] = useState(false);
  const [active, setActive] = useState(true);
  const [hover, setHover] = useState<{ t: number; x: number } | null>(null);
  const [scrub, setScrub] = useState(false);
  const [flash, setFlash] = useState<{ k: number; play: boolean } | null>(null);
  const [cc, setCcState] = useState(initialCC);
  const idle = useRef(0);
  const D = FILM.duration;

  /* ---------------- playback ---------------- */
  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setStarted(true);
    setEnded(false);
    v.play().catch(() => undefined);
  }, []);
  const pause = () => videoRef.current?.pause();
  const toggle = (withFlash = true) => {
    const v = videoRef.current;
    if (!v) return;
    const willPlay = v.paused || v.ended;
    if (willPlay) play();
    else pause();
    if (withFlash && started) setFlash({ k: performance.now(), play: willPlay });
  };
  const seek = (t: number, andPlay = false) => {
    const v = videoRef.current;
    if (!v) return;
    const to = Math.max(0, Math.min(D - 0.05, t));
    v.currentTime = to;
    setTime(to);
    setEnded(false);
    if (andPlay) play();
  };
  // the video element's own events
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
      volumechange: () => {
        setMuted(v.muted);
        setVolume(v.volume);
      },
    };
    Object.entries(on).forEach(([k, f]) => v.addEventListener(k, f));
    return () => Object.entries(on).forEach(([k, f]) => v.removeEventListener(k, f));
  }, []);
  // a smooth clock while playing (timeupdate only fires a few times a second)
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

  // the hero's "Watch the film" button
  useEffect(() => {
    const on = () => {
      const box = boxRef.current;
      if (box) {
        const r = box.getBoundingClientRect();
        window.scrollTo({ top: Math.max(0, r.top + window.scrollY - Math.max(84, (window.innerHeight - r.height) / 2)), behavior: reduce ? 'auto' : 'smooth' });
      } else scrollToId('film');
      play();
      box?.focus({ preventScroll: true });
    };
    window.addEventListener(FILM_EVENT, on);
    return () => window.removeEventListener(FILM_EVENT, on);
  }, [play, reduce]);

  // controls hide after a moment without the pointer while playing
  const wake = () => {
    setActive(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setActive(false), 2600);
  };
  useEffect(() => {
    if (!playing) {
      window.clearTimeout(idle.current);
      setActive(true);
    } else wake();
    return () => window.clearTimeout(idle.current);
  }, [playing]);

  // fullscreen
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    document.addEventListener('webkitfullscreenchange', on);
    return () => {
      document.removeEventListener('fullscreenchange', on);
      document.removeEventListener('webkitfullscreenchange', on);
    };
  }, []);
  const toggleFull = () => {
    const box = boxRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    const doc = document as Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element };
    if (document.fullscreenElement || doc.webkitFullscreenElement) (document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document);
    else if (box?.requestFullscreen) box.requestFullscreen().catch(() => undefined);
    else if (box?.webkitRequestFullscreen) box.webkitRequestFullscreen();
    else v?.webkitEnterFullscreen?.();
  };
  const setCc = (on: boolean) => {
    setCcState(on);
    try {
      localStorage.setItem(CC_KEY, on ? '1' : '0');
    } catch {
      /* ignore */
    }
  };
  // the WebVTT track stays hidden (the strip below draws the subtitles); iOS shows it in its own full screen
  useEffect(() => {
    const v = videoRef.current as (HTMLVideoElement & { webkitDisplayingFullscreen?: boolean }) | null;
    if (!v) return;
    const sync = () => {
      const tr = v.textTracks?.[0];
      if (tr) tr.mode = cc && v.webkitDisplayingFullscreen ? 'showing' : 'hidden';
    };
    sync();
    v.addEventListener('webkitbeginfullscreen', sync);
    v.addEventListener('webkitendfullscreen', sync);
    v.textTracks?.addEventListener?.('addtrack', sync);
    return () => {
      v.removeEventListener('webkitbeginfullscreen', sync);
      v.removeEventListener('webkitendfullscreen', sync);
      v.textTracks?.removeEventListener?.('addtrack', sync);
    };
  }, [cc]);
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.8;
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key.toLowerCase();
    const map: Record<string, () => void> = {
      ' ': () => toggle(),
      k: () => toggle(),
      arrowleft: () => seek(time - 5),
      arrowright: () => seek(time + 5),
      j: () => seek(time - 10),
      l: () => seek(time + 10),
      m: toggleMute,
      f: toggleFull,
      c: () => setCc(!cc),
      home: () => seek(0),
      end: () => seek(D),
    };
    if (/^[0-9]$/.test(k)) map[k] = () => seek((Number(k) / 10) * D);
    const f = map[k];
    if (!f) return;
    e.preventDefault();
    f();
    wake();
  };

  /* ---------------- the progress bar ---------------- */
  const tAt = (clientX: number) => {
    const r = barRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * D;
  };
  const onBarDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setScrub(true);
    if (!started) play();
    seek(tAt(e.clientX));
  };
  const onBarMove = (e: PointerEvent<HTMLDivElement>) => {
    const t = tAt(e.clientX);
    setHover({ t, x: (t / D) * 100 });
    if (scrub) seek(t);
  };
  const onBarUp = (e: PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    setScrub(false);
  };

  const cur = chapterAt(time);
  const cue = started ? cueAt(time) : null;
  const showControls = started && !ended && (active || !playing || scrub || hover !== null);
  const hoverCh = hover ? chapterAt(hover.t) : 0;

  return (
    <Section id="film" tone="alt" className="pb-24 pt-14 sm:pb-28 sm:pt-16">
      <Container wide>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="max-w-[760px]">
            <p className="text-[14px] font-[700] text-accent">The film · {fmtTime(D)}</p>
            <h2 className="display-lg mt-1.5 text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.02] text-ink">
              <SplitText text="The Trinity in under two minutes" tag="span" splitType="words, chars" effect="rise" delay={16} duration={0.7} textAlign="left" mask className="!block" />
            </h2>
            <p className="mt-3 max-w-[62ch] font-serif text-[1.05rem] leading-[1.55] text-ink-2">The whole argument in the order of this page, narrated in English, with subtitles in English and Chinese.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={FILM.src}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-3.5 text-[13px] font-[650] text-ink-2 transition-colors hover:border-rule-2 hover:text-ink"
            >
              <Icon icon={Download04Icon} size={16} />
              MP4 · {FILM.sizeMB} MB
            </a>
          </div>
        </div>

        <motion.div
          className="mt-9 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
          initial={reduce ? false : { opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {/* ---------------- the player ---------------- */}
          <div
            ref={boxRef}
            tabIndex={0}
            role="region"
            aria-label="Film player. Space plays or pauses, arrows seek, C toggles subtitles, F toggles full screen."
            onKeyDown={onKey}
            onPointerMove={() => started && wake()}
            className={`group/player relative overflow-hidden bg-[#f3f4f7] outline-none ring-accent/50 focus-visible:ring-4 ${full ? 'flex flex-col' : 'rounded-[26px] border border-rule shadow-[0_50px_100px_-60px_rgba(20,24,40,0.75)]'}`}
            style={{ cursor: started && playing && !showControls ? 'none' : undefined }}
          >
            <div className={full ? 'relative min-h-0 w-full flex-1' : 'relative aspect-video'}>
              <video
                ref={videoRef}
                src={FILM.src}
                poster={FILM.poster}
                preload="none"
                playsInline
                crossOrigin={SINGLE ? 'anonymous' : undefined}
                className="absolute inset-0 h-full w-full bg-[#f3f4f7] object-contain"
                onClick={() => toggle()}
                onDoubleClick={toggleFull}
                aria-label="The Trinity, promotional film"
              >
                <track kind="subtitles" srcLang="en" label="English and 中文" src={FILM.captions} />
              </video>

              {/* before the first play, and after the end: the poster with one clear action */}
              <AnimatePresence>
                {(!started || ended) && (
                  <motion.button
                    type="button"
                    key={ended ? 'end' : 'start'}
                    onClick={() => (ended ? seek(0, true) : play())}
                    className="group/poster absolute inset-0 block text-left"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.35 } }}
                    aria-label={ended ? 'Play the film again' : 'Play the film'}
                  >
                    <img
                      src={FILM.poster}
                      alt=""
                      className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-out ${reduce ? '' : 'group-hover/poster:scale-[1.025]'}`}
                      draggable={false}
                    />
                    <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_10%_100%,rgba(10,12,20,0.38),transparent_55%)]" aria-hidden />
                    <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-4 sm:left-[5%] sm:top-auto sm:bottom-[7%] sm:translate-x-0 sm:translate-y-0 sm:gap-5">
                      <span className="relative grid h-[clamp(52px,6.2vw,84px)] w-[clamp(52px,6.2vw,84px)] place-items-center rounded-full bg-accent text-white shadow-[0_18px_40px_-14px_rgba(200,16,46,0.75)] transition-transform duration-300 group-hover/poster:scale-[1.06]">
                        {!reduce && !ended && <span className="film-ring absolute inset-0 rounded-full" aria-hidden />}
                        <Icon icon={ended ? RepeatIcon : PlayIcon} size={30} stroke={2.2} className={ended ? '' : 'translate-x-[2px]'} />
                      </span>
                      <span className="hidden rounded-2xl bg-[rgba(12,14,22,0.62)] px-3.5 py-2.5 text-white backdrop-blur-md sm:block">
                        <span className="block text-[clamp(14px,1.55vw,20px)] font-[760] leading-tight tracking-[-0.01em]">{ended ? 'Watch again' : 'Watch the film'}</span>
                        <span className="mt-0.5 block text-[clamp(11px,1vw,13px)] font-[560] text-white/75">
                          {fmtTime(D)} · {CHAPTERS.length} chapters · English and 中文 subtitles
                        </span>
                      </span>
                    </span>
                    {ended && (
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToId('problem');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            scrollToId('problem');
                          }
                        }}
                        className="absolute bottom-[7%] right-[5%] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-[13px] font-[700] text-[#12141c] shadow-lg backdrop-blur transition-colors hover:bg-white"
                      >
                        Read on <Icon icon={ArrowDown01Icon} size={16} />
                      </span>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* play / pause flash in the middle */}
              <AnimatePresence>
                {flash && (
                  <motion.span
                    key={flash.k}
                    className="pointer-events-none absolute left-1/2 top-1/2 grid h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(12,14,22,0.55)] text-white backdrop-blur-sm"
                    initial={{ opacity: 0.9, scale: 0.78 }}
                    animate={{ opacity: 0, scale: 1.18 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    onAnimationComplete={() => setFlash(null)}
                    aria-hidden
                  >
                    <Icon icon={flash.play ? PlayIcon : PauseIcon} size={30} stroke={2.2} className={flash.play ? 'translate-x-[2px]' : ''} />
                  </motion.span>
                )}
              </AnimatePresence>

              {/* buffering */}
              {started && playing && waiting && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/40 border-t-white" aria-hidden />
              )}

              {/* ---------------- controls ---------------- */}
              <div
                className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-[rgba(10,12,20,0.66)] via-[rgba(10,12,20,0.22)] to-transparent" aria-hidden />
                <div className="relative px-4 pb-3 sm:px-5 sm:pb-4">
                  {/* chapter-segmented timeline */}
                  <div
                    ref={barRef}
                    className="group/bar relative flex h-5 cursor-pointer touch-none items-center gap-[3px]"
                    onPointerDown={onBarDown}
                    onPointerMove={onBarMove}
                    onPointerUp={onBarUp}
                    onPointerCancel={onBarUp}
                    onPointerLeave={() => !scrub && setHover(null)}
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
                      const hot = hover !== null && hoverCh === i;
                      return (
                        <span
                          key={i}
                          className={`relative h-[5px] overflow-hidden rounded-full bg-white/25 transition-[height] duration-200 group-hover/bar:h-[7px] ${hot ? '!h-[9px]' : ''}`}
                          style={{ flexGrow: b - a, flexBasis: 0 }}
                        >
                          <span className="absolute inset-y-0 left-0 bg-white/35" style={{ width: `${loaded * 100}%` }} />
                          <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${played * 100}%` }} />
                        </span>
                      );
                    })}
                    <span
                      className={`pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(200,16,46,0.45)] transition-[scale] duration-200 group-hover/bar:scale-100 ${scrub ? 'scale-100' : 'scale-0'}`}
                      style={{ left: `${(time / D) * 100}%` }}
                      aria-hidden
                    />
                    {/* hover preview: the chapter's frame, its name and the time */}
                    <AnimatePresence>
                      {hover && (
                        <motion.span
                          className="pointer-events-none absolute bottom-[calc(100%+12px)] w-[188px] -translate-x-1/2 overflow-hidden rounded-[14px] bg-[rgba(12,14,22,0.82)] p-1.5 text-white shadow-2xl backdrop-blur-md"
                          style={{ left: `clamp(94px, ${hover.x}%, calc(100% - 94px))` }}
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.16 }}
                        >
                          <img src={chapterThumb(hoverCh)} alt="" className="block aspect-video w-full rounded-[9px] object-cover" draggable={false} />
                          <span className="flex items-baseline justify-between gap-2 px-1 pb-0.5 pt-1.5">
                            <span className="truncate text-[12.5px] font-[700]">{CHAPTERS[hoverCh].title}</span>
                            <span className="tabular shrink-0 text-[11.5px] font-[600] text-white/70">{fmtTime(hover.t)}</span>
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-white sm:gap-3">
                    <button type="button" onClick={() => toggle(false)} className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/15" aria-label={playing ? 'Pause' : 'Play'}>
                      <Icon icon={playing ? PauseIcon : PlayIcon} size={20} stroke={2} />
                    </button>
                    <span className="tabular text-[12.5px] font-[650] text-white/90">
                      {fmtTime(time)} <span className="text-white/50">/ {fmtTime(D)}</span>
                    </span>
                    <span className="hidden min-w-0 truncate text-[12.5px] font-[600] text-white/70 sm:inline">
                      <span className="mx-1.5 text-white/35">·</span>
                      {CHAPTERS[cur].title}
                    </span>
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={() => setCc(!cc)}
                      aria-pressed={cc}
                      className={`relative grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/15 ${cc ? 'text-white' : 'text-white/55'}`}
                      aria-label={cc ? 'Hide subtitles' : 'Show subtitles'}
                    >
                      <Icon icon={ClosedCaptionIcon} size={20} stroke={2} />
                      <span className={`absolute bottom-[5px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-accent transition-all duration-300 ${cc ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} aria-hidden />
                    </button>
                    <span className="group/vol hidden items-center sm:flex">
                      <button type="button" onClick={toggleMute} className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/15" aria-label={muted ? 'Unmute' : 'Mute'}>
                        <Icon icon={muted || volume === 0 ? VolumeMute02Icon : VolumeHighIcon} size={19} stroke={2} />
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={muted ? 0 : volume}
                        onChange={(e) => {
                          const v = videoRef.current;
                          if (!v) return;
                          v.volume = Number(e.target.value);
                          v.muted = v.volume === 0;
                        }}
                        className="film-volume w-0 opacity-0 transition-all duration-300 group-hover/vol:w-[72px] group-hover/vol:opacity-100 focus:w-[72px] focus:opacity-100"
                        aria-label="Volume"
                      />
                    </span>
                    <button type="button" onClick={toggleFull} className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/15" aria-label={full ? 'Exit full screen' : 'Full screen'}>
                      <Icon icon={full ? Minimize01Icon : FullScreenIcon} size={19} stroke={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- subtitles, under the picture ---------------- */}
            <AnimatePresence initial={false}>
              {cc && (
                <motion.div
                  key="cc"
                  className="shrink-0 overflow-hidden border-t border-rule bg-surface"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  aria-live="off"
                >
                  <FilmSubtitles cue={cue} size={full ? 'full' : 'page'} hint={!started && <SubtitleHint />} className={full ? 'min-h-[86px] px-10' : 'min-h-[64px] px-5 sm:min-h-[70px] sm:px-10'} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ---------------- chapters ---------------- */}
          <div className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <p className="text-[13px] font-[720] text-ink">Chapters</p>
              <p className="text-[12px] font-[600] text-ink-3">click to jump</p>
            </div>
            <ol className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 xl:mx-0 xl:flex-col xl:gap-[3px] xl:overflow-visible xl:px-0 xl:pb-0">
              {CHAPTERS.map((c, i) => {
                const on = started && i === cur;
                const a = c.t;
                const b = chapterEnd(i);
                const k = Math.max(0, Math.min(1, (time - a) / (b - a)));
                return (
                  <li key={i} className="w-[168px] shrink-0 snap-start xl:w-auto">
                    <button
                      type="button"
                      onClick={() => seek(c.t + 0.01, true)}
                      className={`group/ch relative flex w-full flex-col gap-2 rounded-[12px] p-1.5 text-left transition-[background-color,box-shadow] duration-300 xl:grid xl:grid-cols-[84px_minmax(0,1fr)] xl:items-center xl:gap-3 xl:p-1 ${
                        on ? 'bg-surface shadow-[0_14px_30px_-22px_rgba(20,24,40,0.55)] ring-1 ring-accent/35' : 'hover:bg-surface/70'
                      }`}
                      aria-current={on ? 'true' : undefined}
                    >
                      <span className="relative block aspect-video overflow-hidden rounded-[8px] bg-paper">
                        <img src={chapterThumb(i)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover/ch:scale-[1.07]" draggable={false} />
                        <span className={`absolute inset-0 grid place-items-center bg-[rgba(12,14,22,0.35)] text-white transition-opacity duration-300 ${on && playing ? 'opacity-0' : 'opacity-0 group-hover/ch:opacity-100'}`} aria-hidden>
                          <Icon icon={PlayIcon} size={18} stroke={2.2} />
                        </span>
                        {on && (
                          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-black/25" aria-hidden>
                            <span className="block h-full bg-accent" style={{ width: `${k * 100}%` }} />
                          </span>
                        )}
                        {on && playing && (
                          <span className="absolute right-1.5 top-1.5 flex h-3.5 items-end gap-[2px] rounded bg-[rgba(12,14,22,0.6)] px-1 pb-[2px]" aria-hidden>
                            {[0, 1, 2].map((j) => (
                              <span key={j} className="film-eq w-[2px] rounded-full bg-white" style={{ animationDelay: `${j * 0.18}s` }} />
                            ))}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 px-0.5">
                        <span className="tabular flex items-baseline gap-2 text-[11px] font-[700] text-ink-3">
                          <span className={on ? 'text-accent' : ''}>{String(i + 1).padStart(2, '0')}</span>
                          <span>{fmtTime(c.t)}</span>
                        </span>
                        <span className={`mt-0.5 block truncate text-[13px] font-[700] leading-snug ${on ? 'text-ink' : 'text-ink-2 group-hover/ch:text-ink'}`}>{c.title}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
