/**
 * Results, as reported in the paper (2026-10-25 version). Every number below is copied from a
 * table or computed from Table 8 (Appendix D); nothing is a placeholder.
 */
import { NATIVE_TRAIN, TRAIN_SETTINGS, UNSEEN_SETTINGS, type ProtocolId, type CapId } from './tree';

export const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

/** iteration 0 is the Base Harness H0 */
export const ITERS = [0, 1, 2, 3, 4] as const;

/**
 * Benchmark-equal means, Base to iteration 4 (Table 8). Figure 5 plots Train over all 28 settings and
 * Unseen over the 16 non-robot benchmarks, the ones Codex and DeepSeek also ran; the headline counts
 * all 18 unseen settings, the two real robots included.
 */
export const MEANS = {
  train: [39.06, 63.8, 67.75, 70.85, 73.16],
  unseen: [42.13, 57.72, 59.57, 60.75, 64.06],
  unseen18: [37.45, 53.53, 55.17, 59.56, 63.61],
  /** the 17 training benchmarks that run on their original environments */
  native: ITERS.map((i) => round1(mean(NATIVE_TRAIN.map((x) => x.scores.it[i])))),
  codex: 47.5,
  deepseek: 46.2,
};

/** the abstract and Figure 1: 73.16 − 39.06 on 28 training settings, 63.61 − 37.45 on 18 unseen ones */
export const HEADLINE = {
  trainGain: 34.1,
  unseenGain: 26.2,
  trainCount: 28,
  unseenCount: 18,
  realWorld: 2,
};

/** sanity check against the paper's means (runs once in development) */
if (import.meta.env.DEV) {
  const tr = ITERS.map((i) => round2(mean(TRAIN_SETTINGS.map((x) => x.scores.it[i]))));
  const un = ITERS.map((i) => round2(mean(UNSEEN_SETTINGS.filter((x) => !x.embodied).map((x) => x.scores.it[i]))));
  const un18 = ITERS.map((i) => round2(mean(UNSEEN_SETTINGS.map((x) => x.scores.it[i]))));
  if (tr.join() !== MEANS.train.join() || un.join() !== MEANS.unseen.join() || un18.join() !== MEANS.unseen18.join()) console.warn('Table 8 means differ', tr, un, un18);
}

/* ------------------------------------------------------------------ */
/* Table 2: evolved modules vs prepared skills (iteration 1)           */
/* ------------------------------------------------------------------ */
export type AblRow = { name: string; module: boolean; skill: boolean; train: number; unseen: number; ours?: boolean; base?: boolean };
export const TABLE2: AblRow[] = [
  { name: 'Base (H₀)', module: false, skill: false, train: 39.06, unseen: 37.45, base: true },
  { name: 'Module Only', module: true, skill: false, train: 56.95, unseen: 47.26 },
  { name: 'Skill Only', module: false, skill: true, train: 58.86, unseen: 48.67 },
  { name: 'Ours (H(1))', module: true, skill: true, train: 63.8, unseen: 53.53, ours: true },
];

/* ------------------------------------------------------------------ */
/* Table 3: Harness organisation and training curricula (module only)  */
/* ------------------------------------------------------------------ */
export type OrgRow = {
  name: string;
  group?: 'A' | 'B';
  curriculum: string;
  nH: string;
  nEnv: string;
  train: number;
  unseen: number;
  training: number | null;
  infTrain: number;
  infUnseen: number;
  base?: boolean;
  ours?: boolean;
};
export const TABLE3: OrgRow[] = [
  { name: 'Base (H₀)', curriculum: '–', nH: '–', nEnv: '–', train: 39.06, unseen: 37.45, training: null, infTrain: 582.54, infUnseen: 613.07, base: true },
  { name: 'Global', curriculum: 'Real', nH: '1', nEnv: '28', train: 53.04, unseen: 42.92, training: 582.54, infTrain: 531.81, infUnseen: 567.68 },
  { name: 'Task-Domain', group: 'A', curriculum: 'Real', nH: '15', nEnv: '15', train: 51.17, unseen: 40.82, training: 278.25, infTrain: 540.36, infUnseen: 577.33 },
  { name: 'Capability-Domain', group: 'A', curriculum: 'Real', nH: '6', nEnv: '6', train: 49.25, unseen: 39.43, training: 136.94, infTrain: 562.32, infUnseen: 596.58 },
  // Table 3 prints 10 Harnesses and environments for both trees; the text says the trees have 11 non-root nodes
  { name: 'Capability Tree', group: 'B', curriculum: 'Real', nH: '10', nEnv: '10', train: 53.44, unseen: 42.31, training: 211.56, infTrain: 526.53, infUnseen: 563.9 },
  { name: 'Capability Tree', group: 'B', curriculum: 'Sim', nH: '10', nEnv: '10', train: 56.95, unseen: 47.26, training: 405.7, infTrain: 514.42, infUnseen: 549.07, ours: true },
];

/* ------------------------------------------------------------------ */
/* Table 4: capability-aware Harness routing (on H(4))                 */
/* ------------------------------------------------------------------ */
export type RouteRow = { name: string; cap: boolean | null; mem: boolean | null; train: number; trainTok: number; unseen: number; unseenTok: number; ours?: boolean; oracle?: boolean; random?: boolean };
export const TABLE4: RouteRow[] = [
  { name: 'Random', cap: null, mem: null, train: 52.74, trainTok: 567.08, unseen: 46.23, unseenTok: 594.25, random: true },
  { name: 'Agent Self-Routing', cap: false, mem: false, train: 65.79, trainTok: 535.53, unseen: 52.36, unseenTok: 582.29 },
  { name: 'Agent Self-Routing', cap: true, mem: false, train: 70.34, trainTok: 510.55, unseen: 58.27, unseenTok: 556.21 },
  { name: 'Agent Self-Routing', cap: true, mem: true, train: 71.27, trainTok: 497.89, unseen: 60.96, unseenTok: 541.28, ours: true },
  { name: 'Oracle', cap: null, mem: null, train: 73.16, trainTok: 486.53, unseen: 63.61, unseenTok: 528.34, oracle: true },
];

/* ------------------------------------------------------------------ */
/* Table 5: module interventions (Train 10 %, skills prepared)         */
/* ------------------------------------------------------------------ */
export type InterventionRow = { name: string; train: number; delta: number | null; tokens: number; baseline?: boolean; ours?: boolean };
export const TABLE5: InterventionRow[] = [
  { name: 'Base (H₀)', train: 39.06, delta: null, tokens: 582.54, baseline: true },
  { name: '+ irrelevant module', train: 40.08, delta: 1.02, tokens: 583.37 },
  { name: '+ relevant module', train: 58.45, delta: 19.39, tokens: 551.85 },
  { name: 'Ours (H(4))', train: 73.16, delta: null, tokens: 496.7, baseline: true, ours: true },
  { name: '− relevant module', train: 70.42, delta: -2.74, tokens: 517.26 },
];

/* ------------------------------------------------------------------ */
/* Table 6: embodied success rates (%) with prepared skills            */
/* ------------------------------------------------------------------ */
export const TABLE6 = {
  soonSim: [0, 20, 20, 80, 80],
  capxSim: [10, 20, 30, 40, 60],
  soonReal: [0, 20, 20, 60, 60],
  capxReal: [0, 20, 20, 40, 60],
};

/* ------------------------------------------------------------------ */
/* Figure 6: capability–protocol correlations at iteration 4           */
/* ------------------------------------------------------------------ */
export const FIG6_COLS: ProtocolId[] = ['per', 'mem', 'inf', 'plan', 'orch', 'loop'];
export const FIG6_ROWS: CapId[] = ['a', 'b', 'c', 'd', 'e', 'f'];
export const FIG6: Record<CapId, number[]> = {
  a: [0.099, 0.306, -0.266, 0.065, 0.068, -0.313],
  b: [-0.183, -0.183, 0.744, -0.013, -0.124, -0.183],
  c: [-0.29, 0.131, -0.246, 0.274, 0.089, -0.08],
  d: [-0.361, 0.042, 0.149, -0.194, 0.028, 0.444],
  e: [0.347, 0.082, -0.155, -0.198, 0.236, -0.183],
  f: [0.286, 0.286, -0.092, -0.229, -0.074, -0.109],
};

/* ------------------------------------------------------------------ */
/* Findings, in the paper's words                                     */
/* ------------------------------------------------------------------ */
export const FINDINGS = [
  {
    n: 1,
    title: 'Capability-driven organization outperforms task-driven specialization.',
    text: 'A capability-centric perspective gives rise to a capability tree, where capability-driven Real2Sim2Real achieves stronger capability transfer and lower inference costs with fewer training environments, demonstrating that less is more.',
  },
  {
    n: 2,
    title: 'Capability-driven RSI sustains iterative improvement.',
    text: 'Continued gains on a fixed capability tree suggest that simulated environments offer further opportunities for capability refinement, with improvements extending to unseen tasks.',
  },
  {
    n: 3,
    title: 'Capability priors guide agent routing.',
    text: 'An agent acting as a Router can use capability priors to select suitable Harnesses. The results suggest that the capability tree provides a semantic basis for matching inferred task requirements to Harness configurations.',
  },
  {
    n: 4,
    title: 'Capability–module priors inform Harness design.',
    text: 'Capability–protocol associations suggest specialization patterns, while controlled interventions show larger gains from relevant module additions and performance losses after their removal. Together, these results support using task capability requirements to guide module selection and composition.',
  },
  {
    n: 5,
    title: 'Capability-Driven RSI supports embodied transfer.',
    text: 'The evaluated Harness–skill configurations improve on both simulated and physical tasks, linking node-level module evolution with task-specific skill preparation.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Creator's shared library, its Base Harness (Appendix C.2, Figure 12) */
/* ------------------------------------------------------------------ */
export type LibFamily = 'visual' | 'evidence' | 'difficulty' | 'budget' | 'impl' | 'schema';
export const LIB_FAMILIES: { id: LibFamily; name: string; color: string }[] = [
  { id: 'visual', name: 'Visual & Interaction', color: '#d8342c' },
  { id: 'evidence', name: 'Evidence & Replay', color: '#2a62d4' },
  { id: 'difficulty', name: 'Difficulty & Novelty', color: '#ee7a1c' },
  { id: 'budget', name: 'Budget & Witness', color: '#1f8a5b' },
  { id: 'impl', name: 'Implementation & Submission', color: '#8a5530' },
  { id: 'schema', name: 'Schema & Handoffs', color: '#8a909c' },
];

/** bootstrap: installed before the first node; pre: learned in the offline and manual passes before RSI; it1: installed by the merge at the end of iteration 1 */
export type LibModule = { id: string; family: LibFamily; name: string; origin: 'bootstrap' | 'pre' | 'it1'; revisedIt1?: boolean; from?: string[] };
export const CREATOR_LIB: LibModule[] = [
  { id: 'C01', family: 'visual', name: 'Public Visual State and Probe Coverage Audit', origin: 'pre' },
  { id: 'C02', family: 'visual', name: 'Target Attributes, Classes, and Acceptance Audit', origin: 'it1', from: ['a', 'b', 'c', 'd→b'] },
  { id: 'C03', family: 'visual', name: 'Controlled Identity and Frame-State Alignment Audit', origin: 'it1', from: ['b', 'c', 'd→a'] },
  { id: 'C04', family: 'visual', name: 'Action Polarity and Coordinate Basis Audit', origin: 'it1', from: ['a', 'b'] },
  { id: 'C05', family: 'visual', name: 'Interaction Coverage and Decision-Time Visibility Audit', origin: 'it1', from: ['b', 'd'] },
  { id: 'C06', family: 'evidence', name: 'Claim and Execution Evidence Census', origin: 'bootstrap' },
  { id: 'C07', family: 'evidence', name: 'Bounded Search Declaration Audit', origin: 'bootstrap' },
  { id: 'C08', family: 'evidence', name: 'Accepted Entry and Terminal Consistency', origin: 'pre', revisedIt1: true },
  { id: 'C09', family: 'evidence', name: 'Required Composition and Negative Route Audit', origin: 'pre', revisedIt1: true },
  { id: 'C10', family: 'difficulty', name: 'Difficulty Axis Range and Feasibility Audit', origin: 'bootstrap' },
  { id: 'C11', family: 'difficulty', name: 'Screening Band Direction Diagnosis', origin: 'bootstrap' },
  { id: 'C12', family: 'difficulty', name: 'Layout Novelty Ledger', origin: 'bootstrap' },
  { id: 'C13', family: 'difficulty', name: 'Effective Difficulty Change Audit', origin: 'bootstrap' },
  { id: 'C14', family: 'difficulty', name: 'Single Change Attribution Audit', origin: 'bootstrap' },
  { id: 'C15', family: 'difficulty', name: 'Reasoning Change and Direction Audit', origin: 'pre', revisedIt1: true },
  { id: 'C16', family: 'difficulty', name: 'Neutralized Control Initialization and Completion Audit', origin: 'it1', from: ['b', 'd→a'] },
  { id: 'C17', family: 'budget', name: 'Commitment Cost Arithmetic Audit', origin: 'bootstrap' },
  { id: 'C18', family: 'budget', name: 'Witness and Action Ceiling Audit', origin: 'bootstrap' },
  { id: 'C19', family: 'budget', name: 'Submission Budget and Repeated Rejection Guard', origin: 'bootstrap' },
  { id: 'C20', family: 'budget', name: 'Meaningful Exploratory Witness Pricing', origin: 'it1', from: ['e'] },
  { id: 'C21', family: 'impl', name: 'Repair Scope Gate', origin: 'bootstrap' },
  { id: 'C22', family: 'impl', name: 'Production and Private Witness Isolation', origin: 'pre', revisedIt1: true },
  { id: 'C23', family: 'impl', name: 'Submission Artifact Completeness', origin: 'it1', from: ['a'] },
  { id: 'C24', family: 'schema', name: 'Task Design Schema and Axis Type Handoff', origin: 'it1', from: ['c', 'd→a'] },
  { id: 'C25', family: 'schema', name: 'Authoritative Verifier Contract Handoff', origin: 'it1', from: ['all eleven nodes'] },
];
