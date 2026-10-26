import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Icon from '@/components/ui/Icon';
import { ComputerIcon, Cancel01Icon, LeftToRightListBulletIcon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '@/theme/ThemeProvider';
import Sheet from './ui/Sheet';
import ViewToggle from '@/components/ui/ViewToggle';
import Seg from './ui/Seg';
import { StageMark } from './ui/Opener';
import { P_CHAPTERS, goTo } from './chapters';
import { switchView } from './mode';
import titleCat from '@/assets/cats/titlecat.webp';

/** the chapter under the bar, and how far down the page the reader is */
function useReading() {
  const [state, setState] = useState({ id: '', progress: 0, scrolled: false, titled: false });
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let id = '';
      for (const c of P_CHAPTERS) {
        const el = c.ready ? document.getElementById(c.id) : null;
        if (el && el.getBoundingClientRect().top <= 90) id = c.id;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const next = { id, progress, scrolled: window.scrollY > 4, titled: window.scrollY > 170 };
      setState((s) => (s.id === next.id && Math.abs(s.progress - next.progress) < 0.002 && s.scrolled === next.scrolled && s.titled === next.titled ? s : next));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return state;
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to the light theme' : 'Switch to the dark theme'}
      className="p-press relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-rule bg-surface text-ink"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={theme}
          initial={{ y: 18, rotate: -40, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -18, rotate: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="grid place-items-center"
        >
          <Icon icon={dark ? Moon02Icon : Sun03Icon} size={17} stroke={1.9} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function ChapterSheet({ open, onClose, current }: { open: boolean; onClose: () => void; current: string }) {
  const { theme, setTheme } = useTheme();
  const go = (id: string) => {
    onClose();
    // after the sheet has let go of the page's scroll
    window.setTimeout(() => goTo(id), 260);
  };
  return (
    <Sheet open={open} onClose={onClose} label="Chapters">
      <div className="flex items-center justify-between px-5 pb-2 pt-1">
        <p className="text-[19px] font-[780] tracking-[-0.015em] text-ink" style={{ fontStretch: '108%' }}>
          Chapters
        </p>
        <button type="button" onClick={onClose} className="p-press grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink-2" aria-label="Close">
          <Icon icon={Cancel01Icon} size={16} stroke={2} />
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2" aria-label="Chapters">
        <ol>
          {P_CHAPTERS.map((c) => {
            const on = c.id === current;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={!c.ready}
                  onClick={() => go(c.id)}
                  aria-current={on ? 'true' : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${on ? 'bg-accent-wash' : 'active:bg-paper-2'}`}
                >
                  <span className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${on ? 'bg-accent' : 'bg-transparent'}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[16px] font-[720] leading-tight ${c.ready ? 'text-ink' : 'text-ink-3'}`} style={{ fontStretch: '104%' }}>
                      {c.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-ink-3">{c.note}</span>
                  </span>
                  {c.ready ? (
                    c.stage && (
                      <span className="shrink-0 origin-right scale-[0.82]">
                        <StageMark stage={c.stage} />
                      </span>
                    )
                  ) : (
                    <span className="shrink-0 rounded-full border border-dashed border-rule-2 px-2 py-0.5 text-[11.5px] font-[650] text-ink-3">next preview</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="space-y-3 border-t border-rule px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[14.5px] font-[680] text-ink-2">Theme</span>
          <Seg
            id="sheet-theme"
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: <><Icon icon={Sun03Icon} size={15} stroke={2} /> Light</> },
              { value: 'dark', label: <><Icon icon={Moon02Icon} size={15} stroke={2} /> Dark</> },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => switchView('desktop', current)}
          className="p-press flex h-11 w-full items-center justify-center gap-2 rounded-full border border-rule bg-surface text-[14.5px] font-[700] text-ink"
        >
          <Icon icon={ComputerIcon} size={17} stroke={1.9} />
          Open the desktop layout
        </button>
      </div>
    </Sheet>
  );
}

/** the top bar: the cat (back to the top), the chapter being read, the theme, the chapters */
export default function PhoneBar() {
  const { id, progress, scrolled, titled } = useReading();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const current = P_CHAPTERS.find((c) => c.id === id);
  const barRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={barRef} className="fixed inset-x-0 top-0 z-50">
        <div className={`border-b bg-paper transition-colors duration-300 ${scrolled ? 'border-rule' : 'border-transparent'}`}>
          <div className="mx-auto flex h-[54px] max-w-[560px] items-center gap-2 px-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-press h-9 w-9 shrink-0 overflow-hidden rounded-full border border-rule bg-surface"
              aria-label="Back to the top"
            >
              <img src={titleCat} alt="" className="h-full w-full scale-[1.25] object-contain" draggable={false} />
            </button>
            <div className="relative h-9 min-w-0 flex-1">
              <AnimatePresence initial={false}>
                {titled && (
                  <motion.div
                    key="title"
                    className="absolute inset-0 flex flex-col justify-center"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span className="truncate text-[14.5px] font-[780] leading-tight tracking-[-0.01em] text-ink" style={{ fontStretch: '110%' }}>
                      The Trinity
                    </span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={current?.id ?? 'top'}
                        className="truncate text-[12px] font-[600] leading-tight text-ink-3"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        {current ? current.title : 'Overview'}
                      </motion.span>
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <ViewToggle current="phone" size="sm" anchor={() => id} />
            <ThemeButton />
            {/* the label shows where there is room for it; on smaller phones the list icon alone */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="p-press inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-ink text-[13.5px] font-[700] text-paper min-[414px]:pl-3 min-[414px]:pr-3.5"
              aria-haspopup="dialog"
              aria-label="Chapters"
            >
              <Icon icon={LeftToRightListBulletIcon} size={16} stroke={2} />
              <span className="hidden min-[414px]:inline">Chapters</span>
            </button>
          </div>
        </div>
        {/* how far down the page */}
        <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent" style={{ transform: `scaleX(${progress})` }} aria-hidden />
      </div>
      <ChapterSheet open={open} onClose={close} current={id} />
    </>
  );
}
