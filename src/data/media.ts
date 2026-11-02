/**
 * Images taken from the paper, numbered as in arXiv:2610.36077 (v1):
 *   e1/<bench>-start|h0|h4  Appendix E.1, the shared start frame and the final frames of H0 and H4;
 *   e2/<node>-it<k>         Appendix E.2, the level Creator built for a node, solved in iteration k;
 *   e3/fig69..fig73         Appendix E.3, the embodied settings (faces pixelated, as in the paper);
 *   e3/<task>-trial-<k>     Figure 8, the four steps of a real-robot trial (SOON E01, CaP-X C-01);
 *   e3/frames/...           Figures 70–73 cut into their frames, to play them in order;
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

export const embodied = (n: 69 | 70 | 71 | 72 | 73) => E3[`../assets/paper/e3/fig${n}.webp`];
/** the four panels of Figure 69 */
export const scene = (task: 'soon' | 'capx', kind: 'real' | 'sim') => E3[`../assets/paper/e3/${task}-${kind}.webp`];
/** Figure 8: step k (1–4) of the recorded real-robot trial */
export const trial = (task: 'soon' | 'capx', k: number) => E3[`../assets/paper/e3/${task}-trial-${k}.webp`];
/** Figures 70–73, cut into frames: run (H0 or H4), setting and camera, frame k (1–6) */
export type RecordView = 'real-office' | 'real-head' | 'sim-office' | 'sim-head' | 'real-wrist' | 'sim-wrist';
export const recordFrame = (task: 'soon' | 'capx', run: 'h0' | 'h4', view: RecordView, k: number) => FRAMES[`../assets/paper/e3/frames/${task}-${run}-${view}-${k}.webp`];

export type PaperFig = { n: number; src: string; caption: string; w: number; h: number; thumb?: string };
const fig = (n: number, file: string, w: number, h: number, caption: string): PaperFig => ({ n, src: FIG[`../assets/paper/fig/${file}.webp`], w, h, caption, thumb: figThumb(file) });
/** the paper's figures behind the "Figure N in the paper" buttons (keys are the site's own: summary is Figure 1, the overview; overview is Figure 2, the detailed pipeline) */
export const PAPER_FIGS = {
  summary: fig(1, 'fig01', 2000, 948, 'Figure 1 | Overview of The Trinity. Creator, Explorer, and Evolver connect multimodal task-space expansion (left) with capability-driven Harness evolution (right) through verified feedback. The lower panels summarize tree construction, world exploration and creation, and capability-aware routing; the charts report mean and benchmark-level Train/Unseen performance across RSI iterations.'),
  overview: fig(2, 'fig02', 2000, 1612, 'Figure 2 | Detailed pipeline of The Trinity. Three stages build task, capability, and Harness trees. Worlds are verified and screened; Harnesses evolve through selective inheritance and local refinement.'),
  worlds: fig(3, 'fig03', 1100, 1007, 'Figure 3 | Capability-driven world creation at node d.'),
  embodied: fig(8, 'fig08', 1800, 777, 'Figure 8 | Embodied Transfer of Capability-Evolved Harnesses. Real scenes, simulators, and robot trials (SOON E01; CaP-X C-01). The circle marks the revealed cube.'),
  taskTree: fig(9, 'fig09', 1536, 1024, 'Figure 9 | Task tree. The 44 benchmarks are grouped into five domains and 15 subclasses. Training benchmarks take the colour of their domain and unseen benchmarks a lighter shade of it; SOON and CaP-X show their simulation and real-robot versions; * marks environments rebuilt from published rules.'),
  flatTree: fig(10, 'fig10', 1536, 1024, 'Figure 10 | Flat capability tree. Bricks keep the colours of Figure 9; unseen benchmarks are in italics; * marks rebuilt environments.'),
  capTree: fig(11, 'fig11', 1536, 1024, 'Figure 11 | Capability tree. Each node is one combination of capabilities, read along the branch from the root, and each benchmark sits at the node of its combination. Bricks keep the colours of Figure 9; unseen benchmarks are in italics; * marks rebuilt environments.'),
  harnessTree: fig(12, 'fig12', 1536, 1024, 'Figure 12 | Explorer Harness tree. Every node Harness starts from H0 and combines the modules it selectively inherits with its own local modules. Brick colours mark capability families, and labels give module IDs.'),
  creatorLib: fig(13, 'fig13', 1402, 1122, 'Figure 13 | Creator shared Harness. The root is the Base Harness H0 with the pre-RSI modules. Each node shows the modules proposed or revised at that node. The modules of all nodes are merged and deduplicated into one shared library of 25 modules. Brick colours group the library by function.'),
};
