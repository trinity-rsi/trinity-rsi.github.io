/**
 * Paper metadata (2026-10-23 version). Links are empty until the paper / code are public.
 */
export const LINKS = {
  paper: '', // e.g. https://arxiv.org/abs/xxxx.xxxxx  (empty = button shows "coming soon")
  code: '', // e.g. https://github.com/<org>/the-trinity
  huggingface: '', // e.g. https://huggingface.co/<org>
};

export const PAPER = {
  title: 'The Trinity',
  subtitle: 'Capability-Driven Recursive Self-Improvement for Multimodal Agents',
  team: 'The Trinity Research Team',
  lab: 'InfRec, Cardinal AI Lab',
  date: 'October 2026',
  backbone: 'Claude Opus 5',
  position:
    'Current RSI training relies too heavily on specific tasks, limiting capability generalization across tasks. We advocate a shift from task-driven training to a capability-driven loop: shared capability requirements across tasks guide learning and optimization of multiple specialized Harnesses. This reveals cross-task generalization mechanisms and naturally motivates a Router that matches tasks to Harnesses by required capabilities.',
  abstract: [
    'Multimodal intelligence can be viewed as human-guided co-evolution between worlds and agents through interaction. However, scaling this process faces two bottlenecks: constructing heterogeneous, verifiable environments is costly, and manual Harness iteration cannot keep pace with growing task diversity and complexity.',
    'A key insight is that tasks with different modalities and surface forms can share the same underlying capability requirements. We therefore introduce The Trinity, a recursive self-improvement framework coupling world generation with Harness evolution through three roles: Creator, Explorer, and Evolver. Drawing on verified execution trajectories, Evolver shifts the basis of task organization from surface categories to shared requirements, reorganizing the original task tree into a hierarchical capability tree.',
    'We introduce Capability-Driven Real2Sim2Real: for heterogeneous tasks at the same node, Creator abstracts their common requirements into simplified, verifiable simulated worlds for capability learning, while evaluation on original tasks measures transfer. Along this capability tree, Explorer progressively evolves reusable capability modules through selective inheritance, forming a Harness tree whose validated updates accumulate across iterations within a fixed topology.',
    'The resulting Harnesses specialize in different capabilities, motivating a Capability-Aware Harness Router that uses public task information to select compatible module configurations from the tree. Our evolved Harnesses improve mean performance by 34.1 points across 28 training benchmarks and 22.0 points across 16 unseen benchmarks, with transfer to two real-world embodied settings.',
  ],
  contributions: [
    {
      title: 'Capability-driven multimodal RSI',
      text: 'Shared capability requirements become the organizing principle of Harness evolution. Capability-Driven Real2Sim2Real turns them into compact training worlds, yielding a reusable module-based Harness tree whose specialization motivates capability-aware routing.',
    },
    {
      title: 'Capability–module priors for Harness design',
      text: 'Task-level capability requirements are connected to reusable module configurations, using empirical associations and controlled interventions to examine which module support matters for a task.',
    },
    {
      title: 'Efficient evolution and transfer',
      text: 'Targeting shared decision logic supports effective Harness improvement at low evolution cost, with transfer across heterogeneous tasks, unseen benchmarks and real-world embodied settings.',
    },
  ],
};

/** numbered as in the paper (there is no affiliation 8) */
export const AFFILIATIONS: { n: number; name: string }[] = [
  { n: 1, name: 'InfRec' },
  { n: 2, name: 'Xidian University' },
  { n: 3, name: 'Tongji University' },
  { n: 4, name: 'National University of Singapore' },
  { n: 5, name: 'University of California, Berkeley' },
  { n: 6, name: 'The Chinese University of Hong Kong' },
  { n: 7, name: 'The Hong Kong University of Science and Technology' },
  { n: 9, name: 'The University of Hong Kong' },
];

export type Author = { name: string; aff: number[] };

export const AUTHORS: { group: string; people: Author[] }[] = [
  {
    group: 'Core contributors',
    people: [
      { name: 'Weidong Tang', aff: [1, 2] },
      { name: 'Ruiheng Wang', aff: [3] },
      { name: 'Jingxuan Zhang', aff: [4] },
      { name: 'Hexin Wang', aff: [1] },
    ],
  },
  {
    group: 'Contributors',
    people: [
      { name: 'Haoyuan Chen', aff: [1] },
      { name: 'Zhengfeiyang Zhang', aff: [1, 4] },
      { name: 'Yixing Ma', aff: [1, 5] },
      { name: 'Zichen Jiang', aff: [4] },
      { name: 'Ziyu Guo', aff: [6] },
      { name: 'Haodong Li', aff: [6] },
      { name: 'Zhengbo Jiao', aff: [7] },
      { name: 'Zhiqing Cui', aff: [7] },
      { name: 'Xinxiang Yin', aff: [9] },
      { name: 'Zhenglin Wan', aff: [4] },
      { name: 'Wangbo Zhao', aff: [7] },
      { name: 'Kaipeng Zhang', aff: [1] },
    ],
  },
  {
    group: 'Corresponding authors',
    people: [
      { name: 'Pengfei Zhou', aff: [1, 4] },
      { name: 'Odin Zhang', aff: [5] },
      { name: 'Yang You', aff: [4] },
    ],
  },
];

export const BIBTEX = `@article{trinity2026,
  title   = {The Trinity: Capability-Driven Recursive
             Self-Improvement for Multimodal Agents},
  author  = {Tang, Weidong and Wang, Ruiheng and Zhang, Jingxuan
             and Wang, Hexin and Chen, Haoyuan and Zhang, Zhengfeiyang
             and Ma, Yixing and Jiang, Zichen and Guo, Ziyu
             and Li, Haodong and Jiao, Zhengbo and Cui, Zhiqing
             and Yin, Xinxiang and Wan, Zhenglin and Zhao, Wangbo
             and Zhang, Kaipeng and Zhou, Pengfei and Zhang, Odin
             and You, Yang},
  journal = {arXiv preprint},
  year    = {2026}
}`;

export const ROLES = [
  {
    id: 'creator',
    name: 'Creator',
    color: 'var(--creator)',
    verb: 'Builds worlds',
    text: 'Abstracts the requirements a capability node shares into simplified, verifiable worlds, and pools module proposals from every node into one shared library.',
    stages: 'Stage 2',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    color: 'var(--explorer)',
    verb: 'Acts in worlds',
    text: 'Collects verified trajectories on every task, then evolves a Harness tree along the capability tree through selective inheritance and local refinement.',
    stages: 'Stages 1, 3',
  },
  {
    id: 'evolver',
    name: 'Evolver',
    color: 'var(--evolver)',
    verb: 'Organizes and evolves',
    text: 'Turns task specifications and verified trajectories into capability requirements, builds the capability tree, and writes the module updates.',
    stages: 'Stages 1–3',
  },
] as const;

/** the six flows of Figure 2 (top row) */
export const FLOWS = [
  { from: 'creator', to: 'explorer', label: 'Generate world' },
  { from: 'explorer', to: 'creator', label: 'Explore world' },
  { from: 'explorer', to: 'evolver', label: 'Trajectory and outcome-level feedback' },
  { from: 'evolver', to: 'explorer', label: 'Adaptive Harness evolution' },
  { from: 'creator', to: 'evolver', label: 'World verification feedback' },
  { from: 'evolver', to: 'creator', label: 'Long-horizon Harness evolution' },
] as const;

/** the method, in the order of Section 3 */
export const STAGES = [
  {
    key: 'stage1',
    n: '1',
    kicker: 'Stage 1',
    title: 'Task tree construction',
    who: ['evolver', 'explorer'],
    parts: ['Benchmark organization', 'World exploration'],
    text: 'Public multimodal benchmarks are normalized into specifications of goals, observations, actions, feedback, completion criteria and budgets, and grouped into five domains. Explorer runs H₀ on sampled instances of every task.',
    href: 'stage-1',
  },
  {
    key: 'stage2',
    n: '2',
    kicker: 'Stage 2',
    title: 'Capability tree construction',
    who: ['evolver', 'creator'],
    parts: ['Requirement organization', 'World creation'],
    text: 'Verified trajectories reveal what each task requires. Capability paths merge into a tree, and Creator turns each node’s requirement into simplified, verifiable worlds.',
    href: 'stage-2',
  },
  {
    key: 'stage3',
    n: '3',
    kicker: 'Stage 3',
    title: 'Harness tree construction',
    who: ['explorer', 'evolver'],
    parts: ['Reusable modules', 'Selective inheritance'],
    text: 'Explorer plays each node’s worlds with inherited and local modules; Evolver builds reusable modules from the runs. Validated updates accumulate over iterations on the fixed tree.',
    href: 'stage-3',
  },
  {
    key: 'router',
    n: '→',
    kicker: 'Deployment',
    title: 'Capability-aware routing',
    who: ['router'],
    parts: ['Experience memory', 'Commit one Harness'],
    text: 'For a new task, the Router reads public task information, retrieves verified experience, and commits one compatible Harness from the tree before execution.',
    href: 'router',
  },
] as const;
