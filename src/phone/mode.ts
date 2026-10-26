/**
 * Which layout the page shows: the phone mode (src/phone) or the desktop page (src/App).
 *   ?view=phone / ?view=desktop  choose one and remember it
 *   a remembered choice          wins over the screen size
 *   otherwise                    phones (narrower than 640 px) get the phone mode, when it is on by default
 */
export type View = 'phone' | 'desktop';

const KEY = 'trinity-view';

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

/** the visitor asked for the desktop page on a phone, so offer the way back */
export const choseDesktopOnPhone = () => saved() === 'desktop' && isNarrow();

/** remember the choice and reload into the other layout (at the top, without ?view) */
export function switchView(v: View) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode */
  }
  const u = new URL(location.href);
  u.searchParams.delete('view');
  u.hash = '';
  location.replace(u.toString());
}
