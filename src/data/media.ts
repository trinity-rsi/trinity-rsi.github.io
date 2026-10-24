/**
 * Images taken from the paper (see RSI_Homepage/修改目标_论文1023版.md):
 *   e1/<bench>-start|h0|h4  Appendix E.1, the shared start frame and the final frames of H0 and H4;
 *   e2/<node>-it<k>         Appendix E.2, the level Creator built for a node, solved in iteration k;
 *   e3/fig67..fig71         Appendix E.3, the embodied settings;
 *   fig/figNN               the paper's figures, for the "view in the paper" lightboxes.
 */
import type { NodeId } from './tree';

const E1 = import.meta.glob<string>('../assets/paper/e1/*.webp', { eager: true, import: 'default' });
const E2 = import.meta.glob<string>('../assets/paper/e2/*.webp', { eager: true, import: 'default' });
const E3 = import.meta.glob<string>('../assets/paper/e3/*.webp', { eager: true, import: 'default' });
const FIG = import.meta.glob<string>('../assets/paper/fig/*.webp', { eager: true, import: 'default' });

export const e1Frame = (bench: string, kind: 'start' | 'h0' | 'h4') => E1[`../assets/paper/e1/${bench}-${kind}.webp`];

const NODE_SLUG: Record<Exclude<NodeId, 'root'>, string> = { c: 'c', cd: 'c-d', cda: 'c-d-a', ca: 'c-a', d: 'd', da: 'd-a', db: 'd-b', a: 'a', b: 'b', e: 'e', ef: 'e-f' };
export const nodeLevel = (node: Exclude<NodeId, 'root'>, it: number) => E2[`../assets/paper/e2/${NODE_SLUG[node]}-it${it}.webp`];

export const embodied = (n: 67 | 68 | 69 | 70 | 71) => E3[`../assets/paper/e3/fig${n}.webp`];
/** the four panels of Figure 67 */
export const scene = (task: 'soon' | 'capx', kind: 'real' | 'sim') => E3[`../assets/paper/e3/${task}-${kind}.webp`];

export type PaperFig = { n: number; src: string; caption: string; w: number; h: number };
const fig = (n: number, file: string, w: number, h: number, caption: string): PaperFig => ({ n, src: FIG[`../assets/paper/fig/${file}.webp`], w, h, caption });
export const PAPER_FIGS = {
  summary: fig(1, 'fig01', 2000, 948, 'Figure 1 | Summary. Multimodal task-space expansion and Harness co-evolution, connected through Creator, Explorer and Evolver.'),
  overview: fig(2, 'fig02', 2000, 1612, 'Figure 2 | Overview of The Trinity. Creator, Explorer and Evolver connect task discovery, capability analysis, world construction, Harness evolution and routing through verified feedback on a fixed capability tree.'),
  worlds: fig(3, 'fig03', 1100, 1007, 'Figure 3 | Capability-driven world creation. Shared requirements guide a synthetic world.'),
  taskTree: fig(7, 'fig07', 1536, 1024, 'Figure 7 | Task tree. Training benchmarks take the colour of their domain and unseen benchmarks a light shade of it; SOON and CaP-X show their simulation and real-robot versions; * marks rebuilt environments.'),
  flatTree: fig(8, 'fig08', 1536, 1024, 'Figure 8 | Flat capability tree. Each capability lists the benchmarks that require it.'),
  capTree: fig(9, 'fig09', 1536, 1024, 'Figure 9 | Capability tree. Each node is one combination of capabilities, read along the branch from the root; a benchmark hangs below the node of its combination.'),
  harnessTree: fig(10, 'fig10', 1536, 1024, 'Figure 10 | Explorer Harness tree. Node configurations retain inherited and local modules.'),
  creatorLib: fig(11, 'fig11', 1402, 1122, 'Figure 11 | Creator shared Harness. Module families group the shared library by function for display.'),
};
