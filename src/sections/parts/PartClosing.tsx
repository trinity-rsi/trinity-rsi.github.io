import ResultsSection from '../ResultsSection';
import RealWorldSection from '../RealWorldSection';
import VisualRecordSection from '../VisualRecordSection';
import { Cite, Footer, Team } from '../Closing';

export default function PartClosing() {
  return (
    <>
      <ResultsSection />
      <RealWorldSection />
      <VisualRecordSection />
      <Team />
      <Cite />
      <Footer />
    </>
  );
}
