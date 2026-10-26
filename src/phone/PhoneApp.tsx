import { useEffect } from 'react';
import './phone.css';
import PhoneBar from './PhoneBar';
import PHero from './sections/PHero';
import PFilm from './sections/PFilm';
import PProblem from './sections/PProblem';
import PExamples from './sections/PExamples';
import PTrinity from './sections/PTrinity';
import PWorlds from './sections/PWorlds';
import PHarness from './sections/PHarness';
import PRouter from './sections/PRouter';
import PResults from './sections/PResults';
import PRobots from './sections/PRobots';
import PRecord from './sections/PRecord';
import PTree from './sections/PTree';
import { PAbstract, PFooter, PTeam, PreviewNote } from './sections/PClosing';
import { goTo } from './chapters';

/** The phone mode: the same paper, laid out for a phone held upright. */
export default function PhoneApp() {
  // honour a #hash in the URL once the chapters exist
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) requestAnimationFrame(() => goTo(id, false));
  }, []);

  return (
    <div className="p-root mx-auto max-w-[560px] overflow-x-clip bg-paper">
      <PhoneBar />
      <main>
        <PHero />
        <PFilm />
        <PProblem />
        <PExamples />
        <PTrinity />
        <PTree />
        <PWorlds />
        <PHarness />
        <PRouter />
        <PResults />
        <PRobots />
        <PRecord />
        <PreviewNote />
        <PAbstract />
        <PTeam />
      </main>
      <PFooter />
    </div>
  );
}
