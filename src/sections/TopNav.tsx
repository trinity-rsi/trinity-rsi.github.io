import { useEffect, useMemo, useState } from 'react';
import PillNav from '@/components/reactbits/PillNav/PillNav';
import SquishSwitch from '@/components/reactbits/SquishSwitch/SquishSwitch';
import Icon from '@/components/ui/Icon';
import ViewToggle from '@/components/ui/ViewToggle';
import { showViewToggle } from '@/phone/mode';
import { Cancel01Icon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useTokens } from '@/theme/tokens';
import { scrollToId, useScrollSpy } from '@/lib/hooks';
import titleCat from '@/assets/cats/titlecat.webp';

export const NAV = [
  { label: 'Film', href: '#film' },
  { label: 'Problem', href: '#problem' },
  { label: 'Trinity', href: '#trinity' },
  { label: 'Task tree', href: '#stage-1' },
  { label: 'Capability tree', href: '#stage-2' },
  { label: 'Harness tree', href: '#stage-3' },
  { label: 'Router', href: '#router' },
  { label: 'Results', href: '#results' },
  { label: 'Cite', href: '#cite' },
];

const HINT_KEY = 'trinity-theme-hint-v2';

/**
 * One-time nudge on the first visit: once the hero has finished its entrance, a callout under the
 * switch says the page also comes in dark. It goes away when the visitor switches, dismisses it,
 * scrolls on, or after 10 s, and never comes back.
 */
function useThemeHint(theme: string) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(HINT_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (seen) return;
    let hide = 0;
    const open = window.setTimeout(() => {
      if (window.scrollY > 200) return;
      setShow(true);
      try {
        localStorage.setItem(HINT_KEY, '1');
      } catch {
        /* ignore */
      }
      hide = window.setTimeout(() => setShow(false), 10000);
    }, 3200);
    const onScroll = () => {
      if (window.scrollY > 320) setShow(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(hide);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  // switching the theme answers the hint
  useEffect(() => {
    if (theme === 'dark') setShow(false);
  }, [theme]);
  return [show, () => setShow(false)] as const;
}

export default function TopNav() {
  const { theme, setTheme } = useTheme();
  const { t } = useTokens();
  const [hint, closeHint] = useThemeHint(theme);
  // sections without their own nav entry light up the nearest one
  const ids = useMemo(() => ['overview', 'trinity', 'capability-tree', 'evolution', 'router', 'growth', 'results', 'real-world', 'team', 'cite'], []);
  const spied = useScrollSpy(ids);
  const ALIAS: Record<string, string> = { trinity: 'overview', 'real-world': 'results', team: 'cite' };
  const active = ALIAS[spied] ?? spied;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 px-4 pt-3 sm:px-6">
        <div className="pointer-events-auto min-w-0 flex-1">
          <PillNav
            logo={<img src={titleCat} alt="" className="h-full w-full scale-[1.25] object-contain" />}
            logoAlt="The Trinity, back to top"
            logoHref="#top"
            items={NAV}
            activeHref={active ? `#${active}` : '#'}
            onItemClick={(item, _i, e) => {
              e.preventDefault();
              if (item.href) scrollToId(item.href.slice(1));
            }}
            theme={theme}
            size="sm"
            surface="glass"
            highlightColor={t.accent}
            highlightTextColor="#ffffff"
            indicator="dot"
            hoverEffect="fill"
            intro
          />
        </div>
        {showViewToggle() && <ViewToggle current="desktop" className="pointer-events-auto bg-surface/70 backdrop-blur-xl" />}
        <div className="pointer-events-auto relative flex shrink-0 items-center gap-2 rounded-full border border-rule bg-surface/70 px-2.5 py-1.5 backdrop-blur-xl">
          <Icon icon={Sun03Icon} size={16} className={theme === 'light' ? 'text-ink' : 'text-ink-3'} />
          <span className="relative inline-flex">
            {hint && <span className="theme-hint-ring pointer-events-none absolute -inset-[3px] rounded-full" aria-hidden />}
          <SquishSwitch
            checked={theme === 'dark'}
            onChange={(on) => setTheme(on ? 'dark' : 'light')}
            ariaLabel="Dark mode"
            width={46}
            height={26}
            radius={13}
            trackColor={t.rule2}
            trackOnColor="#2a3150"
            thumbColor="#ffffff"
            thumbOnColor={t.accent}
          />
          </span>
          <Icon icon={Moon02Icon} size={16} className={theme === 'dark' ? 'text-ink' : 'text-ink-3'} />
          {/* callout: always mounted, shown with a CSS transition so it never depends on JS animation frames */}
          <div
            role="status"
            aria-hidden={!hint}
            data-open={hint ? '' : undefined}
            className="theme-hint absolute right-0 top-[calc(100%+14px)] z-10 flex w-max max-w-[min(310px,calc(100vw-32px))] items-center gap-3 rounded-2xl border border-rule bg-surface py-2.5 pl-3 pr-2 shadow-[0_22px_48px_-22px_rgba(12,16,30,0.5)]"
          >
            {/* the arrow points at the switch itself (centre of the track, 51 px from the pill's right edge) */}
            <span className="absolute -top-[7px] right-[51px] h-3.5 w-3.5 rotate-45 rounded-[3px] border-l border-t border-rule bg-surface" aria-hidden />
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-paper">
              <Icon icon={Moon02Icon} size={17} />
            </span>
            <button type="button" tabIndex={hint ? 0 : -1} onClick={() => setTheme('dark')} className="text-left">
              <span className="block text-[14px] font-[720] leading-tight text-ink">Prefer it dark?</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">This page has a night theme. Flip the switch above, or tap here.</span>
            </button>
            <button
              type="button"
              tabIndex={hint ? 0 : -1}
              onClick={closeHint}
              className="grid h-7 w-7 shrink-0 place-items-center self-start rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Dismiss"
            >
              <Icon icon={Cancel01Icon} size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
