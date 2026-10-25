/**
 * Task tree, capability tree and Harness tree, exactly as in the paper (2026-10-25 version):
 *   - benchmarks, domains and the 15 task families: Appendix A, Table 1, Figure 8;
 *   - the six capabilities and each benchmark's node: Appendix B, Figures 9 and 10;
 *   - the eleven node Harnesses, modules M01–M29 and what each node learned in iterations 1–4:
 *     Appendix C.1, Figure 11 and the node figures of Appendix E.2;
 *   - every score: Table 8 (Appendix D).
 * Edit this file to update every visualization on the page at once.
 */
import {
  Atom01Icon,
  Billiard01Icon,
  BlockGameIcon,
  Book01Icon,
  BoxingGloveIcon,
  BrickWallIcon,
  Car01Icon,
  Cards01Icon,
  Chat01Icon,
  CheckListIcon,
  Chess01Icon,
  CodeIcon,
  CubeIcon,
  DiceIcon,
  EyeIcon,
  Film01Icon,
  Flag01Icon,
  FlaskConicalIcon,
  Flowchart01Icon,
  GhostIcon,
  Grid3x3Icon,
  Key01Icon,
  LayerIcon,
  MazeIcon,
  Message01Icon,
  MountainSnowIcon,
  PickaxeIcon,
  PuzzleIcon,
  Robot01Icon,
  SwordsIcon,
  Target01Icon,
  UserSearch01Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons';

export type IconSvg = typeof Chess01Icon;

/* ------------------------------------------------------------------ */
/* Task domains (Table 1) and task families (Figure 8)                 */
/* ------------------------------------------------------------------ */
export type DomainId = 'rule' | 'constraint' | 'percep' | 'multi' | 'long';

export const DOMAINS: { id: DomainId; name: string; long: string; short: string; color: string }[] = [
  { id: 'rule', name: 'Rule discovery', long: 'Latent Rule & Mechanism Discovery', short: 'Rules', color: 'var(--d-rule)' },
  { id: 'constraint', name: 'Constrained problem solving', long: 'Constraint Solving, Puzzles & Design', short: 'Constraints', color: 'var(--d-constraint)' },
  { id: 'percep', name: 'Perception and control', long: 'Perception, Navigation & Control', short: 'Perception', color: 'var(--d-percep)' },
  { id: 'multi', name: 'Multi-agent interaction', long: 'Multi-Agent Strategy & Social Interaction', short: 'Multi-agent', color: 'var(--d-multi)' },
  { id: 'long', name: 'Long-horizon environments', long: 'Long-Horizon Open-Ended Environments', short: 'Long-horizon', color: 'var(--d-long)' },
];
export const domainById = Object.fromEntries(DOMAINS.map((d) => [d.id, d])) as Record<DomainId, (typeof DOMAINS)[number]>;

export type FamilyId =
  | 'query-oracle'
  | 'experiment'
  | 'undisclosed'
  | 'deduction'
  | 'rearrangement'
  | 'artifact'
  | 'active-perception'
  | 'navigation'
  | 'control'
  | 'video'
  | 'hidden-identity'
  | 'cooperative'
  | 'repeated'
  | 'command'
  | 'resource';

export const FAMILIES: { id: FamilyId; domain: DomainId; name: string }[] = [
  { id: 'query-oracle', domain: 'rule', name: 'Query-Oracle Rule Identification' },
  { id: 'experiment', domain: 'rule', name: 'Experimental Intervention & Scientific Discovery' },
  { id: 'undisclosed', domain: 'rule', name: 'Undisclosed-Rule Interactive Play' },
  { id: 'deduction', domain: 'constraint', name: 'Rule-Complete Deduction & Search' },
  { id: 'rearrangement', domain: 'constraint', name: 'Spatial Rearrangement under Irreversibility' },
  { id: 'artifact', domain: 'constraint', name: 'Artifact Design & Verifier-Driven Revision' },
  { id: 'active-perception', domain: 'percep', name: 'Active Perception & Viewpoint Selection' },
  { id: 'navigation', domain: 'percep', name: 'Goal-Directed Navigation & Spatial Memory' },
  { id: 'control', domain: 'percep', name: 'Continuous Control & Physical Intervention' },
  { id: 'video', domain: 'percep', name: 'Video Understanding' },
  { id: 'hidden-identity', domain: 'multi', name: 'Hidden Identity & Deception' },
  { id: 'cooperative', domain: 'multi', name: 'Cooperative Coordination & Constrained Signaling' },
  { id: 'repeated', domain: 'multi', name: 'Repeated Strategic & Economic Games' },
  { id: 'command', domain: 'long', name: 'Command-Driven Interactive Worlds' },
  { id: 'resource', domain: 'long', name: 'Resource & Schedule Management over a Long Horizon' },
];
export const familyById = Object.fromEntries(FAMILIES.map((f) => [f.id, f])) as Record<FamilyId, (typeof FAMILIES)[number]>;

/* ------------------------------------------------------------------ */
/* The six capabilities (Appendix B)                                   */
/* ------------------------------------------------------------------ */
export type CapId = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

export const CAPS: { id: CapId; name: string; abbr: string; color: string; defects: string[] }[] = [
  {
    id: 'a',
    name: 'Perception & State Tracking',
    abbr: 'PST',
    color: 'var(--cap-a)',
    defects: [
      'Host action-protocol and output-format fidelity',
      'Observation-to-state grounding',
      'Action and parameter effect calibration',
      'Instruction-to-action grounding',
      'Outcome ledger: no re-issue of refuted or inert items',
      'Re-acquisition of out-of-window facts',
      'Exploration coverage and route reuse',
    ],
  },
  {
    id: 'b',
    name: 'Hypothesis & Counterpart Inference',
    abbr: 'HCI',
    color: 'var(--cap-b)',
    defects: [
      'Evidence-consistent hypothesis maintenance',
      'Discriminating probe design',
      'Data-to-model inference with assumption checks',
      'Counterpart modelling from revealed history',
      'Receiver-aware signalling',
    ],
  },
  {
    id: 'c',
    name: 'Constraint Checking & Feedback Repair',
    abbr: 'CFR',
    color: 'var(--cap-c)',
    defects: [
      'Pre-commit one-step constraint check',
      'Multi-step constraint propagation to forced moves',
      'Reachability lookahead before irreversible action',
      'Feasibility-checked complete plan',
      'Feedback-localised repair',
      'Non-convergence detection and method switching',
    ],
  },
  {
    id: 'd',
    name: 'Goal Commitment & Value Trade-off',
    abbr: 'GVT',
    color: 'var(--cap-d)',
    defects: [
      'Evidence-gated commitment',
      'Goal-discrepancy-directed action selection',
      'Goal-completing opportunity recognition',
      'Goal-predicate verification before terminal action',
      'Budget pacing and terminal-action reservation',
      'Scored-objective valuation of options and policies',
    ],
  },
  {
    id: 'e',
    name: 'Video Evidence Acquisition',
    abbr: 'VEA',
    color: 'var(--cap-e)',
    defects: ['Question-guided evidence acquisition', 'Coverage-adequate frame sampling', 'Non-visual channel access'],
  },
  {
    id: 'f',
    name: 'Video Comprehension',
    abbr: 'VC',
    color: 'var(--cap-f)',
    defects: ['Frame-grounded perception and order reading', 'Motion, counting and 3D dynamics across frames', 'Cross-frame event integration and inference'],
  },
];
export const capById = Object.fromEntries(CAPS.map((c) => [c.id, c])) as Record<CapId, (typeof CAPS)[number]>;

/* ------------------------------------------------------------------ */
/* Harness protocol classes (Section 2.2)                              */
/* ------------------------------------------------------------------ */
export type ProtocolId = 'per' | 'mem' | 'inf' | 'plan' | 'orch' | 'loop';

export const PROTOCOLS: {
  id: ProtocolId;
  name: string;
  abbr: string;
  sym: string; // KaTeX
  out: string; // KaTeX for the produced quantity
  eq: string; // KaTeX for the update rule
  role: string;
}[] = [
  {
    id: 'per',
    name: 'Perception',
    abbr: 'Percep.',
    sym: '\\Pi_{\\mathrm{er}}',
    out: 'f_t',
    eq: 'f_t = \\Pi_{\\mathrm{er}}(o_t,\\, \\xi_{<t})',
    role: 'Extracts facts from the observation and the public history.',
  },
  {
    id: 'mem',
    name: 'Memory',
    abbr: 'Mem.',
    sym: '\\mathcal{M}',
    out: 'v_t',
    eq: 'v_t = \\mathcal{M}(\\xi_{<t},\\, s_t,\\, f_t)',
    role: 'Builds a history-conditioned view; the only class that may declare explicit carry.',
  },
  {
    id: 'inf',
    name: 'Inference',
    abbr: 'Infer.',
    sym: '\\mathcal{I}',
    out: '\\mathrm{Cand}_t',
    eq: '\\mathrm{Cand}_t = \\mathcal{I}(\\tau,\\, v_t)',
    role: 'Maintains the candidates still compatible with what was observed.',
  },
  {
    id: 'plan',
    name: 'Planning',
    abbr: 'Plan.',
    sym: '\\mathcal{P}',
    out: 'd_t',
    eq: 'd_t = \\mathcal{P}(\\tau,\\, s_t,\\, v_t,\\, \\mathrm{Cand}_t)',
    role: 'Ranks or prunes options into a directive.',
  },
  {
    id: 'orch',
    name: 'Orchestration',
    abbr: 'Orch.',
    sym: '\\mathcal{F}',
    out: '\\mathcal{C}_t',
    eq: '\\mathcal{C}_t = \\mathcal{F}(\\mathcal{C}_\\tau,\\, s_t,\\, v_t,\\, d_t)',
    role: 'Identifies the applicable resources within a fixed host-exposed tool set.',
  },
  {
    id: 'loop',
    name: 'Loop',
    abbr: 'Loop',
    sym: '\\mathcal{L}',
    out: '(s_{t+1}, e_t, c_t)',
    eq: '(s_{t+1},\\, e_t,\\, c_t) = \\mathcal{L}(s_t,\\, v_t,\\, d_t,\\, \\mathcal{C}_t)',
    role: 'Resolves execution and commitment, including withholding action.',
  },
];
export const protocolById = Object.fromEntries(PROTOCOLS.map((p) => [p.id, p])) as Record<ProtocolId, (typeof PROTOCOLS)[number]>;

/* ------------------------------------------------------------------ */
/* Capability tree / Harness tree: eleven nodes below the root          */
/* ------------------------------------------------------------------ */
export type NodeId = 'root' | 'c' | 'cd' | 'cda' | 'ca' | 'd' | 'da' | 'db' | 'a' | 'b' | 'e' | 'ef';
/** what a node's Harness learned in one iteration (Appendix E.2) */
export type NodeEvent = { kind: 'new' | 'revised'; module: string };

export type CapNode = {
  id: NodeId;
  /** capability path from the root, in the fixed order */
  path: CapId[];
  parent: NodeId | null;
  /** the node Harness's name (Figure 11, Appendix E.2) */
  name: string;
  /** modules the node owns (local); descendants inherit them */
  local: string[];
  /** one module event per iteration 1..4 */
  events: NodeEvent[];
};

const ev = (...xs: string[]): NodeEvent[] => xs.map((x) => (x.startsWith('+') ? { kind: 'new', module: x.slice(1) } : { kind: 'revised', module: x }));

/** root first, then a depth-first walk in the order of Figure 10 (left to right) */
export const NODES: CapNode[] = [
  { id: 'root', path: [], parent: null, name: 'Base Harness', local: [], events: [] },
  { id: 'c', path: ['c'], parent: 'root', name: 'Gate Planning & Reachability', local: ['M07', 'M08'], events: ev('+M07', 'M07', '+M08', 'M07') },
  { id: 'cd', path: ['c', 'd'], parent: 'c', name: 'Value & Goal Commitment', local: ['M12', 'M13', 'M14'], events: ev('+M12', '+M13', '+M14', 'M14') },
  { id: 'cda', path: ['c', 'd', 'a'], parent: 'cd', name: 'Execution & Revision Memory', local: ['M15', 'M16'], events: ev('+M15', 'M15', '+M16', 'M15') },
  { id: 'ca', path: ['c', 'a'], parent: 'c', name: 'Identity, Order & Memory', local: ['M09', 'M10', 'M11'], events: ev('+M10', '+M09', '+M11', 'M09') },
  // M29 sits at d in the iteration-4 tree (Figure 11); the node's level record (Figure 61) has no event for it
  { id: 'd', path: ['d'], parent: 'root', name: 'Evidence-Gated Commitment', local: ['M17', 'M18', 'M29'], events: ev('+M17', 'M17', '+M18', 'M17') },
  { id: 'da', path: ['d', 'a'], parent: 'd', name: 'Exploration & Routing', local: ['M19', 'M20', 'M21'], events: ev('+M19', '+M20', '+M21', 'M19') },
  { id: 'db', path: ['d', 'b'], parent: 'd', name: 'Hypothesis Tracking & Probing', local: ['M22', 'M23'], events: ev('+M22', '+M23', 'M22', 'M22') },
  { id: 'a', path: ['a'], parent: 'root', name: 'Evidence & Inspection', local: ['M01', 'M02', 'M03'], events: ev('+M01', '+M02', '+M03', 'M01') },
  { id: 'b', path: ['b'], parent: 'root', name: 'Signaling & Counterpart Decisions', local: ['M04', 'M05', 'M06'], events: ev('+M06', '+M04', '+M05', 'M06') },
  { id: 'e', path: ['e'], parent: 'root', name: 'Video Evidence Acquisition', local: ['M24', 'M25', 'M26'], events: ev('+M25', '+M24', '+M26', 'M24') },
  { id: 'ef', path: ['e', 'f'], parent: 'e', name: 'Video Events & Frame Association', local: ['M27', 'M28'], events: ev('+M28', '+M27', 'M27', 'M27') },
];
export const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, CapNode>;
export const CAP_NODES = NODES.filter((n) => n.id !== 'root');
export const nodeChildren = (id: NodeId) => NODES.filter((n) => n.parent === id);
/** "c → d → a" */
export const pathLabel = (id: NodeId) => (id === 'root' ? 'H₀' : nodeById[id].path.join(' → '));

/** root → … → node */
export function nodeLineage(id: NodeId): CapNode[] {
  const out: CapNode[] = [];
  let cur: CapNode | undefined = nodeById[id];
  while (cur) {
    out.unshift(cur);
    cur = cur.parent ? nodeById[cur.parent] : undefined;
  }
  return out;
}
/** the node Harness's full registry: inherited modules (root first) then its own */
export const nodeModules = (id: NodeId) => nodeLineage(id).flatMap((n) => n.local);

/* ------------------------------------------------------------------ */
/* Modules M01–M29 (Appendix C.1)                                      */
/* ------------------------------------------------------------------ */
export type Module = { id: string; cap: CapId; name: string; node: NodeId };
const MOD_NAMES: [string, CapId, string][] = [
  ['M01', 'a', 'Object Evidence Ledger and Rule Classification'],
  ['M02', 'a', 'Complete Inspection Coverage and Report Reconciliation'],
  ['M03', 'a', 'Identity Binding Across Reversed Views'],
  ['M04', 'b', 'Parity Reversal and Two-Period Signal Selection'],
  ['M05', 'b', 'Contingent Policy Search with Endogenous Signals'],
  ['M06', 'b', 'Opponent Inference, Allocation Scoring and Archive Value'],
  ['M07', 'c', 'Joint Gate Planning, Proposal Validation and Milestone Scheduling'],
  ['M08', 'c', 'Return Reachability Under Asymmetric Gates'],
  ['M09', 'a', 'Relational Orders, Identity Binding and Position Transforms'],
  ['M10', 'a', 'Sealed Observation Archives and Unordered Collection Tours'],
  ['M11', 'a', 'Ordered Prefix Validation and Capacity-Constrained Batch Planning'],
  ['M12', 'd', 'Investment Timing and Scored Value Trade-offs'],
  ['M13', 'd', 'Resource Reserves and Delivery Opportunity Trade-offs'],
  ['M14', 'd', 'Goal Verification, Stopping Decisions and Plan Value'],
  ['M15', 'a', 'Execution Receipt Verification and State-Difference Memory'],
  ['M16', 'a', 'Stage Revision, Deduction Retraction and Execution Memory'],
  ['M17', 'd', 'Evidence Verification, Counterexample Stopping and Submission Budget'],
  ['M18', 'd', 'Relation Verification Within One Object and Coordinate Frame'],
  ['M19', 'a', 'Target Collection, Current-Phase Routing and Frontier Exploration'],
  ['M20', 'a', 'Product-State Routing for Ordered Collection'],
  ['M21', 'a', 'Phase-Dependent Edge Repair and Static Corridor Reuse'],
  ['M22', 'b', 'Candidate Ledger, Dynamic State Alignment and Dual-Objective Probing'],
  ['M23', 'b', 'Decomposing Repeated Symbols into Multiplicity and Position'],
  ['M24', 'e', 'Adaptive Frame, Region and Audio Evidence Acquisition'],
  ['M25', 'e', 'Delivered Evidence Coverage and Acquisition Budget Verification'],
  ['M26', 'e', 'Evidence Gap Acquisition and Unproductive Retry Suppression'],
  ['M27', 'f', 'Handoff Episode Aggregation, Event Ledger and Endpoint Audit'],
  ['M28', 'f', 'Candidate Identity Association Across Frames'],
  ['M29', 'd', 'Fixed Goal Conditions, Evidence Ledger and Bounded Commit Review'],
];
const ownerOf = (m: string) => NODES.find((n) => n.local.includes(m))!.id;
export const MODULES: Module[] = MOD_NAMES.map(([id, cap, name]) => ({ id, cap, name, node: ownerOf(id) }));
export const moduleById = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<string, Module>;

/* ------------------------------------------------------------------ */
/* Benchmarks (44 identities) with their Table 8 scores                */
/* ------------------------------------------------------------------ */
export type Split = 'train' | 'unseen';
/** Base, H(1)..H(4); comparators where the paper reports them */
export type Scores = { it: [number, number, number, number, number]; codex?: number; deepseek?: number };

export type Bench = {
  id: string;
  name: string;
  /** compact label for tight layouts */
  short?: string;
  domain: DomainId;
  family: FamilyId;
  /** SOON and CaP-X: the simulation setting trains, the real-robot setting is unseen */
  split: Split | 'both';
  node: Exclude<NodeId, 'root'>;
  /** rebuilt from published rules (marked * in the paper) */
  rebuilt?: boolean;
  icon: IconSvg;
  measure: string;
  scores: Scores;
  /** embodied benchmarks: robot-setting scores (simulation scores are in `scores`) */
  robot?: Scores;
};

const s = (b: number, h1: number, h2: number, h3: number, h4: number, codex?: number, deepseek?: number): Scores => ({ it: [b, h1, h2, h3, h4], codex, deepseek });

export const BENCHES: Bench[] = [
  // ---------------- Rule discovery
  { id: 'wilt', name: 'WILT', domain: 'rule', family: 'query-oracle', split: 'train', node: 'db', icon: Chat01Icon, measure: 'accuracy, 8 rules, 120 episodes', scores: s(80, 94.2, 94.2, 94.2, 94.2) },
  { id: 'eleusis', name: 'Eleusis', domain: 'rule', family: 'query-oracle', split: 'train', node: 'db', rebuilt: true, icon: Cards01Icon, measure: 'rule found, 6 rules, 90 episodes', scores: s(43.3, 82.2, 81.1, 81.1, 81.1) },
  { id: 'mastermind', name: 'Mastermind', domain: 'rule', family: 'query-oracle', split: 'train', node: 'db', icon: Target01Icon, measure: 'solve rate, 3 codes, 45 episodes', scores: s(53.3, 88.9, 88.9, 88.9, 88.9) },
  { id: 'entity-deduction-arena', name: 'Entity Deduction Arena', short: 'Entity Deduction', domain: 'rule', family: 'query-oracle', split: 'unseen', node: 'b', icon: UserSearch01Icon, measure: 'success rate, 200 entities, 200 episodes', scores: s(64.5, 95, 95, 94.5, 95, 72.5, 67.5) },
  { id: 'boxinggym', name: 'BoxingGym', domain: 'rule', family: 'experiment', split: 'train', node: 'a', icon: BoxingGloveIcon, measure: 'success rate, 3 environments, 45 episodes', scores: s(60, 80, 84.4, 84.4, 84.4) },
  { id: 'discoverphysics', name: 'DiscoverPhysics', domain: 'rule', family: 'experiment', split: 'train', node: 'a', icon: Atom01Icon, measure: 'pass rate, 2 worlds, 30 episodes', scores: s(40, 70, 73.3, 73.3, 73.3) },
  { id: 'scigym', name: 'SciGym', domain: 'rule', family: 'experiment', split: 'unseen', node: 'db', icon: FlaskConicalIcon, measure: 'recovered, 126 systems, 126 episodes', scores: s(25.4, 45.2, 47.6, 50, 57.1, 26.2, 33.3) },
  { id: 'arc-agi-3', name: 'ARC-AGI-3', domain: 'rule', family: 'undisclosed', split: 'train', node: 'da', icon: Grid3x3Icon, measure: 'success rate, 25 games (public set), 183 levels', scores: s(22.4, 41, 45.9, 50.3, 53.6) },
  { id: 'puzzlescript', name: 'PuzzleScript', domain: 'rule', family: 'undisclosed', split: 'train', node: 'c', icon: BlockGameIcon, measure: 'solve rate, 3 levels, 9 episodes', scores: s(66.7, 77.8, 77.8, 77.8, 77.8) },
  { id: 'dig-bench', name: 'DiG-bench', domain: 'rule', family: 'undisclosed', split: 'unseen', node: 'c', icon: LayerIcon, measure: 'levels passed, 13 games, 13 episodes', scores: s(32.5, 33.3, 34.2, 35.1, 36.8, 40.4, 54.4) },

  // ---------------- Constrained problem solving
  { id: 'puzz-link-penpa', name: 'puzz.link / Penpa+', short: 'puzz.link', domain: 'constraint', family: 'deduction', split: 'train', node: 'cda', icon: PuzzleIcon, measure: 'solve rate, 3 puzzles, 9 episodes', scores: s(33.3, 44.4, 44.4, 44.4, 44.4) },
  { id: 'chess-tactics', name: 'Chess Tactics', domain: 'constraint', family: 'deduction', split: 'train', node: 'c', rebuilt: true, icon: Chess01Icon, measure: 'mate found, 3 positions, 27 episodes', scores: s(66.7, 92.6, 96.3, 96.3, 100) },
  { id: 'pencil-puzzle-bench', name: 'Pencil Puzzle Bench', short: 'Pencil Puzzle', domain: 'constraint', family: 'deduction', split: 'unseen', node: 'd', icon: Grid3x3Icon, measure: 'solve rate, 30 puzzles, 30 episodes', scores: s(20, 26.7, 26.7, 26.7, 30, 23.3, 23.3) },
  { id: 'wca-cube-solving', name: 'WCA Cube Solving', short: 'WCA Cube', domain: 'constraint', family: 'rearrangement', split: 'train', node: 'cd', rebuilt: true, icon: CubeIcon, measure: 'solve rate, 3 scrambles, 45 episodes', scores: s(13.3, 51.1, 80, 80, 80) },
  { id: 'minihack-boxoban', name: 'MiniHack Boxoban', domain: 'constraint', family: 'rearrangement', split: 'unseen', node: 'c', icon: BlockGameIcon, measure: 'solve rate, 10 levels, 10 episodes', scores: s(0, 10, 20, 20, 30, 10, 0) },
  { id: 'master-keying', name: 'Master Keying', domain: 'constraint', family: 'artifact', split: 'train', node: 'ca', rebuilt: true, icon: Key01Icon, measure: 'success rate, 3 designs, 33 episodes', scores: s(45.5, 84.8, 84.8, 84.8, 84.8) },
  { id: 'adaplanbench', name: 'AdaPlanBench', domain: 'constraint', family: 'artifact', split: 'train', node: 'ca', icon: Flowchart01Icon, measure: 'accuracy, 3 queries, 27 episodes', scores: s(22.2, 70.4, 74.1, 74.1, 74.1) },
  { id: 'ale-bench', name: 'ALE-Bench', domain: 'constraint', family: 'artifact', split: 'unseen', node: 'cd', icon: CodeIcon, measure: 'percentile, 26 problems, 26 episodes', scores: s(81.3, 85.4, 86.4, 87.4, 91.9, 85, 91.4) },
  { id: 'buildarena', name: 'BuildArena', domain: 'constraint', family: 'artifact', split: 'unseen', node: 'cda', icon: BrickWallIcon, measure: 'pass rate, 9 levels, 45 episodes', scores: s(73.3, 93.3, 95.6, 95.6, 97.8, 77.8, 80) },

  // ---------------- Perception and control
  { id: 'pallet-rack-inspection', name: 'Pallet Rack Inspection', short: 'Pallet Rack', domain: 'percep', family: 'active-perception', split: 'train', node: 'a', rebuilt: true, icon: CheckListIcon, measure: 'success rate, 3 racks, 27 episodes', scores: s(0, 29.6, 37, 37, 59.3) },
  { id: 'pinverify', name: 'PInVerify', domain: 'percep', family: 'active-perception', split: 'train', node: 'd', icon: EyeIcon, measure: 'accuracy, 3 pairs, 45 episodes', scores: s(66.7, 88.9, 93.3, 93.3, 93.3) },
  { id: 'actiview', name: 'ActiView', domain: 'percep', family: 'active-perception', split: 'unseen', node: 'a', icon: EyeIcon, measure: 'accuracy, 1,625 questions, 1,625 episodes', scores: s(73.5, 93.7, 94.6, 95.7, 97.4, 77.2, 73.7) },
  {
    id: 'soon',
    name: 'SOON',
    domain: 'percep',
    family: 'navigation',
    split: 'both',
    node: 'da',
    icon: Robot01Icon,
    measure: 'success rate, 1 route, 5 episodes (sim.) / 10 episodes (robot)',
    scores: s(0, 20, 20, 80, 80),
    robot: s(0, 20, 20, 60, 60),
  },
  { id: 'minihack-maze-corridor', name: 'MiniHack Maze / Corridor', short: 'MiniHack Maze', domain: 'percep', family: 'navigation', split: 'unseen', node: 'c', icon: MazeIcon, measure: 'success rate, 20 levels, 20 episodes', scores: s(55, 80, 80, 80, 85, 60, 75) },
  { id: 'micromouse', name: 'Micromouse', domain: 'percep', family: 'navigation', split: 'train', node: 'da', rebuilt: true, icon: MazeIcon, measure: 'success rate, 3 mazes, 27 episodes', scores: s(55.6, 66.7, 66.7, 77.8, 77.8) },
  { id: 'memory-maze', name: 'Memory Maze', domain: 'percep', family: 'navigation', split: 'train', node: 'ca', icon: MazeIcon, measure: 'success rate, 3 mazes, 9 episodes', scores: s(0, 11.1, 11.1, 11.1, 11.1) },
  {
    id: 'cap-x',
    name: 'CaP-X',
    domain: 'percep',
    family: 'control',
    split: 'both',
    node: 'da',
    icon: Robot01Icon,
    measure: 'success rate, 10 layouts, 10 episodes (sim. and robot)',
    scores: s(10, 20, 30, 40, 60),
    robot: s(0, 20, 20, 40, 60),
  },
  { id: 'phyre', name: 'PHYRE', domain: 'percep', family: 'control', split: 'unseen', node: 'ca', icon: Billiard01Icon, measure: 'solved, 50 tasks, 50 episodes', scores: s(42, 82, 86, 86, 90, 84, 52) },
  { id: 'pooltool-billiards', name: 'Pooltool Billiards', short: 'Pooltool', domain: 'percep', family: 'control', split: 'train', node: 'ca', icon: Billiard01Icon, measure: 'success rate, 3 seeds, 27 episodes', scores: s(33.3, 66.7, 66.7, 66.7, 66.7) },
  { id: 'euro-ncap-aeb', name: 'Euro NCAP AEB', domain: 'percep', family: 'control', split: 'train', node: 'd', rebuilt: true, icon: Car01Icon, measure: 'success rate, 3 scenarios, 9 episodes', scores: s(66.7, 77.8, 88.9, 88.9, 88.9) },
  { id: 'video-index', name: 'Video-Index', domain: 'percep', family: 'video', split: 'train', node: 'ef', icon: Video01Icon, measure: 'accuracy, 777 questions, 777 episodes', scores: s(47.9, 87.5, 87.5, 88.9, 89.4) },
  { id: 'video-mme-v2', name: 'Video-MME-v2', domain: 'percep', family: 'video', split: 'unseen', node: 'ef', icon: Film01Icon, measure: 'accuracy, 1,600 questions, 1,600 episodes', scores: s(48.4, 77.4, 79.5, 80, 80, 54.5, 45.9) },

  // ---------------- Multi-agent interaction
  { id: 'among-us', name: 'Among Us', domain: 'multi', family: 'hidden-identity', split: 'train', node: 'd', icon: GhostIcon, measure: 'win rate, 3 games, 27 episodes', scores: s(11.1, 48.1, 63, 63, 63) },
  { id: 'saboteur', name: 'Saboteur', domain: 'multi', family: 'hidden-identity', split: 'train', node: 'cd', rebuilt: true, icon: PickaxeIcon, measure: 'win rate, 3 games, 27 episodes', scores: s(55.6, 77.8, 77.8, 77.8, 77.8) },
  { id: 'coup', name: 'Coup', domain: 'multi', family: 'hidden-identity', split: 'unseen', node: 'd', icon: SwordsIcon, measure: 'win rate, 40 games, 40 episodes', scores: s(45, 57.5, 57.5, 65, 65, 32.5, 35) },
  { id: 'codenames', name: 'Codenames', domain: 'multi', family: 'cooperative', split: 'train', node: 'b', icon: Cards01Icon, measure: 'win rate, 3 games, 27 episodes', scores: s(33.3, 66.7, 81.5, 81.5, 81.5) },
  { id: 'hanabi', name: 'Hanabi', domain: 'multi', family: 'cooperative', split: 'unseen', node: 'b', icon: DiceIcon, measure: 'success rate, 40 games, 40 episodes', scores: s(0, 5, 10, 15, 20, 0, 0) },
  { id: 'colonel-blotto', name: 'Colonel Blotto', domain: 'multi', family: 'repeated', split: 'train', node: 'b', icon: Flag01Icon, measure: 'win rate, 3 matches, 27 episodes', scores: s(55.6, 85.2, 85.2, 85.2, 88.9) },
  { id: 'glee-persuasion', name: 'GLEE Persuasion', domain: 'multi', family: 'repeated', split: 'train', node: 'd', icon: Message01Icon, measure: 'revenue ≥50%, 3 games, 27 episodes', scores: s(33.3, 63, 63, 63, 63) },
  { id: 'hu-nlhe', name: 'Heads-Up No-Limit Texas Hold’em', short: 'Heads-Up NLHE', domain: 'multi', family: 'repeated', split: 'unseen', node: 'da', icon: Cards01Icon, measure: 'matches ahead, 20 matches, 20 episodes', scores: s(60, 80, 80, 80, 85, 30, 35) },

  // ---------------- Long-horizon environments
  { id: 'textquests', name: 'TextQuests', domain: 'long', family: 'command', split: 'train', node: 'ca', icon: Book01Icon, measure: 'success rate, 3 games, 9 episodes', scores: s(0, 11.1, 11.1, 11.1, 22.2) },
  { id: 'nethack', name: 'NetHack', domain: 'long', family: 'command', split: 'unseen', node: 'cda', icon: SwordsIcon, measure: 'progress, 5 seeds, 5 episodes, 500 steps', scores: s(2.2, 3, 3, 3, 4, 3.7, 2.3) },
  { id: 'the-long-dark', name: 'The Long Dark', domain: 'long', family: 'resource', split: 'train', node: 'cd', rebuilt: true, icon: MountainSnowIcon, measure: 'success rate, 3 runs, 27 episodes', scores: s(77.8, 88.9, 88.9, 88.9, 88.9) },
  { id: 'crafter', name: 'Crafter', domain: 'long', family: 'resource', split: 'unseen', node: 'ca', icon: PickaxeIcon, measure: 'progress, 10 seeds, 10 episodes', scores: s(51, 56, 57, 58, 60, 82.7, 70) },
];

export const benchById = Object.fromEntries(BENCHES.map((b) => [b.id, b])) as Record<string, Bench>;
export const benchesOfNode = (id: NodeId) => BENCHES.filter((b) => b.node === id);
/** benches whose capability set contains every capability on the node's path (the flat tree, Figure 9) */
export const benchesNeeding = (cap: CapId) => BENCHES.filter((b) => nodeById[b.node].path.includes(cap));

/**
 * The evaluation settings of Table 8: 26 training benchmarks plus SOON and CaP-X in simulation
 * (28 Train), 16 unseen benchmarks plus the two real-robot settings (18 Unseen).
 */
export type Setting = { key: string; bench: Bench; label: string; split: Split; embodied?: 'sim' | 'robot'; scores: Scores };
export const SETTINGS: Setting[] = BENCHES.flatMap<Setting>((b) =>
  b.split === 'both'
    ? [
        { key: `${b.id}-sim`, bench: b, label: `${b.name} (sim.)`, split: 'train', embodied: 'sim', scores: b.scores },
        { key: `${b.id}-robot`, bench: b, label: `${b.name} (robot)`, split: 'unseen', embodied: 'robot', scores: b.robot! },
      ]
    : [{ key: b.id, bench: b, label: b.short ?? b.name, split: b.split, scores: b.scores }]
);
export const TRAIN_SETTINGS = SETTINGS.filter((x) => x.split === 'train');
export const UNSEEN_SETTINGS = SETTINGS.filter((x) => x.split === 'unseen');
/** the 17 training benchmarks that run on their original environments (not rebuilt, not simulation) */
export const NATIVE_TRAIN = TRAIN_SETTINGS.filter((x) => !x.bench.rebuilt && !x.embodied);
