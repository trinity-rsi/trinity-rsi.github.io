/**
 * Images taken from the paper (2026-10-25 version):
 *   e1/<bench>-start|h0|h4  Appendix E.1, the shared start frame and the final frames of H0 and H4;
 *   e2/<node>-it<k>         Appendix E.2, the level Creator built for a node, solved in iteration k;
 *   e3/fig68..fig72         Appendix E.3, the embodied settings (faces pixelated, as in the paper);
 *   e3/<task>-trial-<k>     Figure 7, the four steps of a real-robot trial (SOON E01, CaP-X C-01);
 *   e3/frames/...           Figures 69–72 cut into their frames, to play them in order;
 *   fig/figNN               the paper's figures, for the "view in the paper" lightboxes;
 *   thumb/figNN             their 400-px previews, for the buttons that open them.
 */
import type { NodeId } from './tree';

const E1 = import.meta.glob<string>('../assets/paper/e1/*.webp', { eager: true, import: 'default' });
const E2 = import.meta.glob<string>('../assets/paper/e2/*.webp', { eager: true, import: 'default' });
const E3 = import.meta.glob<string>('../assets/paper/e3/*.webp', { eager: true, import: 'default' });
const FIG = import.meta.glob<string>('../assets/paper/fig/*.webp', { eager: true, import: 'default' });
const FRAMES = import.meta.glob<string>('../assets/paper/e3/frames/*.webp', { eager: true, import: 'default' });
/** small previews of the figures (400 px wide), for the buttons that open them */
const THUMB = import.meta.glob<string>('../assets/paper/thumb/*.webp', { eager: true, import: 'default' });
export const figThumb = (file: string) => THUMB[`../assets/paper/thumb/${file}.webp`];

export const e1Frame = (bench: string, kind: 'start' | 'h0' | 'h4') => E1[`../assets/paper/e1/${bench}-${kind}.webp`];

const NODE_SLUG: Record<Exclude<NodeId, 'root'>, string> = { c: 'c', cd: 'c-d', cda: 'c-d-a', ca: 'c-a', d: 'd', da: 'd-a', db: 'd-b', a: 'a', b: 'b', e: 'e', ef: 'e-f' };
export const nodeLevel = (node: Exclude<NodeId, 'root'>, it: number) => E2[`../assets/paper/e2/${NODE_SLUG[node]}-it${it}.webp`];

export const embodied = (n: 68 | 69 | 70 | 71 | 72) => E3[`../assets/paper/e3/fig${n}.webp`];
/** the four panels of Figure 68 */
export const scene = (task: 'soon' | 'capx', kind: 'real' | 'sim') => E3[`../assets/paper/e3/${task}-${kind}.webp`];
/** Figure 7: step k (1–4) of the recorded real-robot trial */
export const trial = (task: 'soon' | 'capx', k: number) => E3[`../assets/paper/e3/${task}-trial-${k}.webp`];
/** Figures 69–72, cut into frames: run (H0 or H4), setting and camera, frame k (1–6) */
export type RecordView = 'real-office' | 'real-head' | 'sim-office' | 'sim-head' | 'real-wrist' | 'sim-wrist';
export const recordFrame = (task: 'soon' | 'capx', run: 'h0' | 'h4', view: RecordView, k: number) => FRAMES[`../assets/paper/e3/frames/${task}-${run}-${view}-${k}.webp`];

export type PaperFig = { n: number; src: string; caption: string; w: number; h: number; thumb?: string };
const fig = (n: number, file: string, w: number, h: number, caption: string): PaperFig => ({ n, src: FIG[`../assets/paper/fig/${file}.webp`], w, h, caption, thumb: figThumb(file) });
export const PAPER_FIGS = {
  summary: fig(1, 'fig01', 2000, 948, 'Figure 1 | Summary. The left and right panels illustrate multimodal task-space expansion and Harness co-evolution, connected through Creator, Explorer and Evolver. The bottom panels summarize the pipeline and the Real2Sim2Real evaluation setting.'),
  overview: fig(2, 'fig02', 2000, 1612, 'Figure 2 | Overview of The Trinity. Creator, Explorer and Evolver connect task discovery, capability analysis, world construction, Harness evolution and routing through verified feedback on a fixed capability tree.'),
  worlds: fig(3, 'fig03', 1100, 1007, 'Figure 3 | Capability-driven world creation at node d.'),
  embodied: fig(7, 'fig07', 1800, 777, 'Figure 7 | Skill preparation and deployment via Real2Sim2Real. Real scenes, simulators, and robot trials (SOON E01; CaP-X C-01). The circle marks the revealed cube.'),
  taskTree: fig(8, 'fig08', 1536, 1024, 'Figure 8 | Task tree. Training benchmarks take the colour of their domain and unseen benchmarks a light shade of it; SOON and CaP-X show their simulation and real-robot versions; * marks rebuilt environments.'),
  flatTree: fig(9, 'fig09', 1536, 1024, 'Figure 9 | Flat capability tree. Each capability lists the benchmarks that require it.'),
  capTree: fig(10, 'fig10', 1536, 1024, 'Figure 10 | Capability tree. Each node is one combination of capabilities, read along the branch from the root; a benchmark hangs below the node of its combination.'),
  harnessTree: fig(11, 'fig11', 1536, 1024, 'Figure 11 | Explorer Harness tree. Node configurations retain inherited and local modules.'),
  creatorLib: fig(12, 'fig12', 1402, 1122, 'Figure 12 | Creator shared Harness. Module families group the shared library by function for display.'),
};
