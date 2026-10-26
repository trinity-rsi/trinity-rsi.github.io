/**
 * Which layout the page shows: the phone mode (src/phone) or the desktop page (src/App).
 *   ?view=phone / ?view=desktop  choose one and remember it
 *   a remembered choice          wins over the screen size
 *   otherwise                    phones (narrower than 640 px) get the phone mode, when it is on by default
 * Both layouts carry a switch between them (ViewToggle); switching keeps the chapter being read.
 */
export type View = 'phone' | 'desktop';

const KEY = 'trinity-view';
const SWITCHED = 'trinity-view-switched';

/** while the phone mode is being previewed it only opens with ?view=phone */
export const PHONE_BY_DEFAULT = false;

export const isNarrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

function saved(): View | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'phone' || v === 'desktop' ? v : null;
  } catch {
    return null;
  }
}

export function chooseView(): View {
  try {
    const q = new URLSearchParams(location.search).get('view');
    if (q === 'phone' || q === 'desktop') {
      localStorage.setItem(KEY, q);
      return q;
    }
  } catch {
    /* private mode */
  }
  return saved() ?? (PHONE_BY_DEFAULT && isNarrow() ? 'phone' : 'desktop');
}

/** the switch shows once the phone mode is public, and already for anyone who has opened the preview */
export const showViewToggle = () => PHONE_BY_DEFAULT || saved() !== null;

/** the sections both layouts share, in page order */
const SECTIONS = ['film', 'problem', 'examples', 'trinity', 'stage-1', 'stage-2', 'world-creation', 'stage-3', 'router', 'results', 'real-world', 'visual-record', 'abstract', 'team', 'cite'];

/** the section under the top of the screen, if any */
export function currentSection(line = 120): string {
  let id = '';
  for (const s of SECTIONS) {
    const el = document.getElementById(s);
    if (el && el.getBoundingClientRect().top <= line) id = s;
  }
  return id;
}

/**
 * Remember the choice and reload into the other layout, at the same section: the page fades to
 * paper first, so the switch reads as one movement rather than a reload.
 */
export function switchView(v: View, anchor = '') {
  try {
    localStorage.setItem(KEY, v);
    sessionStorage.setItem(SWITCHED, '1');
  } catch {
    /* private mode */
  }
  const u = new URL(location.href);
  u.searchParams.delete('view');
  // the phone mode keeps the team with the citation
  u.hash = anchor ? `#${v === 'phone' && anchor === 'team' ? 'cite' : anchor}` : '';
  const veil = document.createElement('div');
  veil.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:var(--paper);opacity:0;transition:opacity .22s ease;pointer-events:none';
  document.body.appendChild(veil);
  requestAnimationFrame(() => (veil.style.opacity = '1'));
  window.setTimeout(() => {
    history.scrollRestoration = 'manual';
    history.replaceState(null, '', u.toString());
    location.reload();
  }, 230);
}

/** after a switch: start from the top (or the section's anchor), not from the old layout's scroll position */
export function settleAfterSwitch() {
  try {
    if (sessionStorage.getItem(SWITCHED) !== '1') return;
    sessionStorage.removeItem(SWITCHED);
  } catch {
    return;
  }
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.setTimeout(() => (history.scrollRestoration = 'auto'), 2500);
}
