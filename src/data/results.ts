/**
 * Results, as reported in the paper (2026-10-23 version). Every number below is copied from a
 * table or computed from Table 7 (Appendix D); nothing is a placeholder.
 */
import { NATIVE_TRAIN, TRAIN_SETTINGS, UNSEEN_SETTINGS, type ProtocolId, type CapId } from './tree';

export const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const round1 = (x: number) => Math.round(x * 10) / 10;

/** iteration 0 is the Base Harness H0 */
export const ITERS = [0, 1, 2, 3, 4] as const;

/** Figure 4 / Table 7: benchmark-equal means. Unseen means cover the 16 non-robot benchmarks. */
export const MEANS = {
  train: [39.1, 63.8, 67.7, 70.8, 73.2],
  unseen: [42.1, 57.7, 59.6, 60.8, 64.1],
  /** the 17 training benchmarks that run on their original environments */
  native: ITERS.map((i) => round1(mean(NATIVE_TRAIN.map((x) => x.scores.it[i])))),
  codex: 47.5,
  deepseek: 46.2,
};

export const HEADLINE = {
  trainGain: 34.1,
  unseenGain: 22.0,
  trainCount: 28,
  unseenCount: 16,
  realWorld: 2,
};

/** sanity check against the paper's means (runs once in development) */
if (import.meta.env.DEV) {
  const tr = ITERS.map((i) => round1(mean(TRAIN_SETTINGS.map((x) => x.scores.it[i]))));
  const un = ITERS.map((i) => round1(mean(UNSEEN_SETTINGS.filter((x) => !x.embodied).map((x) => x.scores.it[i]))));
  if (tr.join() !== MEANS.train.join() || un.join() !== MEANS.unseen.join()) console.warn('Table 7 means differ from Figure 4', tr, un);
}

/* ------------------------------------------------------------------ */
/* Table 2: Harness organisation and training curricula               */
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
export const TABLE2: OrgRow[] = [
  { name: 'Base (H₀)', curriculum: '–', nH: '–', nEnv: '–', train: 41.67, unseen: 37.71, training: null, infTrain: 582.54, infUnseen: 613.07, base: true },
  { name: 'Global', curriculum: 'Real', nH: '1', nEnv: '28', train: 65.24, unseen: 46.92, training: 582.54, infTrain: 548.81, infUnseen: 584.68 },
  { name: 'Task-Domain', group: 'A', curriculum: 'Real', nH: '15', nEnv: '15', train: 64.37, unseen: 48.12, training: 278.25, infTrain: 540.36, infUnseen: 577.33 },
  { name: 'Capability-Domain', group: 'A', curriculum: 'Real', nH: '6', nEnv: '6', train: 64.45, unseen: 48.43, training: 136.94, infTrain: 562.32, infUnseen: 596.58 },
  { name: 'Capability Tree', group: 'B', curriculum: 'Real', nH: '11', nEnv: '11', train: 66.21, unseen: 50.31, training: 211.56, infTrain: 526.53, infUnseen: 563.9 },
  { name: 'Capability Tree', group: 'B', curriculum: 'Sim', nH: '11', nEnv: '11', train: 67.17, unseen: 52.38, training: 405.7, infTrain: 514.42, infUnseen: 549.07, ours: true },
];

/* ------------------------------------------------------------------ */
/* Table 3: capability-aware Harness routing (on H(4))                 */
/* ------------------------------------------------------------------ */
export type RouteRow = { name: string; cap: boolean | null; mem: boolean | null; train: number; trainTok: number; unseen: number; unseenTok: number; ours?: boolean; oracle?: boolean; random?: boolean };
export const TABLE3: RouteRow[] = [
  { name: 'Random', cap: null, mem: null, train: 52.74, trainTok: 567.04, unseen: 41.23, unseenTok: 594.25, random: true },
  { name: 'Agent Self-Routing', cap: false, mem: false, train: 65.79, trainTok: 535.53, unseen: 47.36, unseenTok: 582.29 },
  { name: 'Agent Self-Routing', cap: true, mem: false, train: 70.34, trainTok: 510.54, unseen: 53.24, unseenTok: 556.24 },
  { name: 'Agent Self-Routing', cap: true, mem: true, train: 71.27, trainTok: 497.89, unseen: 55.96, unseenTok: 541.28, ours: true },
  { name: 'Oracle', cap: null, mem: null, train: 73.4, trainTok: 486.53, unseen: 58.03, unseenTok: 528.34, oracle: true },
];

/* ------------------------------------------------------------------ */
/* Table 4: module interventions (Train 10 %, no skills)               */
/* ------------------------------------------------------------------ */
export const TABLE4 = {
  base: { train: 41.67, tokens: 582.54 },
  ours: { train: 73.4 },
  removeRelevant: { train: 70.66, delta: -2.73 },
};

/* ------------------------------------------------------------------ */
/* Table 5: evolved modules vs prepared skills (iteration 1)           */
/* ------------------------------------------------------------------ */
export type AblRow = { name: string; module: boolean; skill: boolean; train: number; unseen: number; ours?: boolean; base?: boolean };
export const TABLE5: AblRow[] = [
  { name: 'Base (H₀)', module: false, skill: false, train: 41.67, unseen: 37.71, base: true },
  { name: 'Module Only', module: true, skill: false, train: 60.95, unseen: 45.56 },
  { name: 'Skill Only', module: false, skill: true, train: 62.86, unseen: 48.67 },
  { name: 'Ours (H(1))', module: true, skill: true, train: 67.17, unseen: 52.38, ours: true },
];

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
    title: 'Structured capability organization supports transfer.',
    text: 'The simulated capability tree achieves the highest reported performance on Train (67.17%) and Unseen (52.38%).',
  },
  {
    n: 2,
    title: 'Recursive evolution accumulates transferable capabilities.',
    text: 'Across successive iterations on the fixed capability tree, the Harness family improves on training benchmarks despite task-level fluctuations, with transfer to unseen benchmarks excluded from module and Router training.',
  },
  {
    n: 3,
    title: 'Capability evidence guides Harness deployment.',
    text: 'Candidate capability descriptions and verified execution experience connect task demands to compatible module configurations.',
  },
  {
    n: 4,
    title: 'Capabilities exhibit distinct module associations.',
    text: 'Different capabilities align with different protocols, notably Inference, Loop, and Perception. These structural correlations motivate module interventions but do not establish their performance effects.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Creator's shared library (Appendix C.2, Figure 11)                  */
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
