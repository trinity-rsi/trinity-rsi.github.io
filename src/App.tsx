import { Suspense, lazy, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TopNav from './sections/TopNav';
import Hero from './sections/Hero';
import FilmSection from './sections/FilmSection';
import Noise from './components/reactbits/Noise/Noise';
import GradualBlur from './components/reactbits/GradualBlur/GradualBlur';
import { useTheme } from './theme/ThemeProvider';
import { useReducedMotion } from './lib/hooks';

// everything below the overview is split into three chunks that start loading right after first paint
const loadMethod = () => import('./sections/parts/PartMethod');
const loadIdeas = () => import('./sections/parts/PartIdeas');
const loadClosing = () => import('./sections/parts/PartClosing');
const PartMethod = lazy(loadMethod);
const PartIdeas = lazy(loadIdeas);
const PartClosing = lazy(loadClosing);

const Hold = ({ h }: { h: string }) => <div style={{ minHeight: h }} aria-hidden />;

export default function App() {
  const { theme } = useTheme();
  const reduce = useReducedMotion();

  useEffect(() => {
    loadMethod().then(loadIdeas).then(loadClosing);
  }, []);

  // Scroll-triggered text effects measure their positions when they mount. Web fonts, images and
  // the lazy parts below change the page's layout afterwards, so re-measure whenever it settles.
  useEffect(() => {
    let timer = 0;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 180);
    };
    document.fonts?.ready.then(refresh);
    const ro = new ResizeObserver(refresh);
    ro.observe(document.body);
    window.addEventListener('load', refresh);
    return () => {
      ro.disconnect();
      window.removeEventListener('load', refresh);
      window.clearTimeout(timer);
    };
  }, []);

  // honour a #hash in the URL once the lazy sections exist
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 40) {
        window.clearInterval(timer);
        el?.scrollIntoView();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <TopNav />
      {/* film grain over the whole page; static when motion is reduced */}
      <Noise fixed zIndex={60} opacity={theme === 'dark' ? 0.045 : 0.03} fps={reduce ? 0 : 10} size={1.2} contrast={0.55} blendMode="overlay" />
      {/* progressive blur along the bottom edge of the viewport, gone at the end of the page */}
      <GradualBlur target="page" position="bottom" height="4.5rem" strength={1.6} layers={5} curve="bezier" exponential opacity={1} autoHide zIndex={45} />
      <main>
        <Hero />
        <FilmSection />
        <Suspense fallback={<Hold h="300vh" />}>
          <PartMethod />
        </Suspense>
        <Suspense fallback={<Hold h="400vh" />}>
          <PartIdeas />
        </Suspense>
        <Suspense fallback={<Hold h="300vh" />}>
          <PartClosing />
        </Suspense>
      </main>
    </>
  );
}
