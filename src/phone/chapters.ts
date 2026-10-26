/**
 * The phone mode's chapters, in the order of the desktop page. `stage` marks the method's own
 * sequence (the only chapters that carry a number); `ready` is false for the chapters still to come
 * in the preview.
 */
export type PChapter = { id: string; title: string; note: string; stage?: string; ready: boolean };

export const P_CHAPTERS: PChapter[] = [
  { id: 'film', title: 'The film', note: 'The paper in 1 minute 46', ready: true },
  { id: 'problem', title: 'The problem', note: 'RSI is still trained task by task', ready: true },
  { id: 'examples', title: 'Shared capabilities', note: 'Different tasks, the same requirements', ready: false },
  { id: 'trinity', title: 'Three roles', note: 'Creator, Explorer and Evolver', ready: false },
  { id: 'stage-1', title: 'Capability tree', note: 'From a task tree to a capability tree', stage: '1–2', ready: true },
  { id: 'world-creation', title: 'Worlds', note: 'Creator builds a world for every node', stage: '2', ready: false },
  { id: 'stage-3', title: 'Harness tree', note: 'Modules evolve along the tree', stage: '3', ready: false },
  { id: 'router', title: 'Router', note: 'One Harness for each new task', stage: '→', ready: false },
  { id: 'results', title: 'Results', note: '+34.1 on training, +26.2 on unseen', ready: false },
  { id: 'real-world', title: 'Real robots', note: 'From simulation to two robots', ready: false },
  { id: 'visual-record', title: 'Visual record', note: 'H₀ and H₄ side by side', ready: false },
  { id: 'abstract', title: 'Abstract', note: 'The paper’s abstract', ready: true },
  { id: 'cite', title: 'Team and citation', note: 'Authors and BibTeX', ready: true },
];

/** scroll a chapter under the top bar */
export function goTo(id: string, smooth = true) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 60;
  window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
}
