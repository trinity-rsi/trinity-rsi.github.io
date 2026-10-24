import ResultsSection from '../ResultsSection';
import RealWorldSection from '../RealWorldSection';
import VisualRecordSection from '../VisualRecordSection';
import AbstractSection from '../AbstractSection';
import { Cite, Footer, Team } from '../Closing';

export default function PartClosing() {
  return (
    <>
      <ResultsSection />
      <RealWorldSection />
      <VisualRecordSection />
      <AbstractSection />
      <Team />
      <Cite />
      <Footer />
    </>
  );
}
