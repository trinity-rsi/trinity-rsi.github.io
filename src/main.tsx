import { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/hubot-sans/wdth.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import '@fontsource-variable/source-serif-4/opsz-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import 'katex/dist/katex.min.css';
import './index.css';
import { ThemeProvider } from './theme/ThemeProvider';
import { choseDesktopOnPhone, chooseView, switchView } from './phone/mode';

// the desktop page and the phone mode are separate chunks: each device downloads only its own
const view = chooseView();
document.documentElement.dataset.view = view;
const App = lazy(() => import('./App'));
const PhoneApp = lazy(() => import('./phone/PhoneApp'));

/** on a phone showing the desktop page by choice: the way back to the phone layout */
function BackToPhone() {
  return (
    <button
      type="button"
      onClick={() => switchView('phone')}
      className="fixed bottom-4 right-4 z-[70] inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-[700] text-paper shadow-[0_14px_30px_-12px_rgba(10,12,20,0.6)]"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <rect x="4" y="1.5" width="8" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 12.2h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Phone layout
    </button>
  );
}

createRoot(document.getElementById('root')!).render(
  // no StrictMode: several WebGL effects release their context on unmount, and StrictMode's
  // dev-only double mount would hand them a lost context
  <ThemeProvider>
    <Suspense fallback={null}>{view === 'phone' ? <PhoneApp /> : <App />}</Suspense>
    {view === 'desktop' && choseDesktopOnPhone() && <BackToPhone />}
  </ThemeProvider>
);
