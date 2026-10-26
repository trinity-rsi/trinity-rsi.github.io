/**
 * The four steps of Stages 1 and 2 (Sections 3.1–3.2), in a sentence or two each: the desktop
 * page and the phone layout both caption the capability-tree figure with these.
 */
export const TREE_STEPS = [
  {
    key: 'task',
    stage: 'Stage 1',
    label: 'Task tree',
    title: 'Benchmark organization',
    who: 'Evolver',
    text: 'Web search yields 44 benchmarks. Each becomes a specification of goals, actions, feedback and budgets, under five domains and fifteen families; the training / unseen split is fixed first.',
  },
  {
    key: 'explore',
    stage: 'Stage 1',
    label: 'Explore',
    title: 'World exploration',
    who: 'Explorer',
    text: 'Explorer runs the Base Harness H₀ on sampled training instances. Only training records feed the later stages, and hash-chain checks verify every run.',
  },
  {
    key: 'diagnose',
    stage: 'Stage 2',
    label: 'Requirements',
    title: 'Requirement organization',
    who: 'Evolver',
    text: 'Agents propose capability categories from the training specifications and runs, a judge consolidates them, reviewers check them: six capabilities, thirty defect types.',
  },
  {
    key: 'cap',
    stage: 'Stage 2',
    label: 'Capability tree',
    title: 'The capability tree',
    who: 'Evolver',
    text: 'Each training task’s requirement set becomes a path, and a trie merges common prefixes into eleven nodes. Unseen benchmarks are placed on the fixed tree afterwards.',
  },
] as const;

/** Figure 3: four tasks at node d that share one decision */
export const FIG3 = [
  { id: 'euro-ncap-aeb', q: 'Noisy range: break or hold?' },
  { id: 'among-us', q: 'Conflicting accounts: what to claim?' },
  { id: 'glee-persuasion', q: 'Buyer feedback: which message?' },
  { id: 'pinverify', q: 'Hidden detail: inspect or decide?' },
];

/** how a world is admitted (Figure 2, Section 3.3), one line a step */
export const WORLD_PIPE = [
  { k: '1', title: 'Generation input', items: ['Templates', 'Capability', 'Constraints', 'Scale', 'Difficulty', 'Notes'], text: 'Evolver designs simplified levels from node requirements and public task specifications, never from solutions.' },
  { k: '2', title: 'Verifier pool', items: ['Fixed: interface, runtime', 'Task-conditioned: goals, solvability'], text: 'Creator builds the level with its node Harness; Evolver’s verifiers stay private.' },
  { k: '3', title: 'Generation world', items: ['Browser world', '3D scene', 'Public rules'], text: 'A simplified level that keeps the core decision process, without aesthetic polish.' },
  { k: '4', title: 'Host verification', items: ['Node binding', 'Execution', 'Transitions', 'Rendering', 'Completion'], text: 'Host-run verifiers check the world; their feedback guides Creator’s revisions.' },
  { k: '5', title: 'Difficulty screening', items: ['Too hard', 'Admit', 'Too easy'], text: 'Explorer admits the world only inside an intermediate-performance band; otherwise Creator adjusts the difficulty.' },
];
/** where each pipeline step starts in its 11-second loop */
export const PIPE_AT = [0, 0.14, 0.28, 0.42, 0.66];
