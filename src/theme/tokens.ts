import { useTheme } from './ThemeProvider';

/** JS mirror of the CSS tokens in index.css (components that take hex props read these). */
export const TOKENS = {
  light: {
    paper: '#f3f4f7',
    paper2: '#e9ebf0',
    surface: '#ffffff',
    surface2: '#f7f8fa',
    ink: '#12141c',
    ink2: '#444a5b',
    ink3: '#737a8e',
    rule: '#dadde6',
    rule2: '#c3c8d4',
    evolver: '#c8102e',
    explorer: '#0e8f86',
    creator: '#c27a00',
    accent: '#c8102e',
    accentInk: '#a50d26',
    accentWash: '#fbe9ec',
    good: '#0a8f0a',
    bad: '#d03b3b',
    domains: { rule: '#2a78d6', constraint: '#eb6834', percep: '#1baf7a', multi: '#eda100', long: '#e87ba4' },
    iters: ['#b8bcc8', '#e7a3a0', '#d5807e', '#bd5a5a', '#9a2b31', '#9a2b31', '#88091d'],
    caps: { a: '#129aab', b: '#7444cf', c: '#1f63d8', d: '#d8342c', e: '#46902f', f: '#dc8a07' },
  },
  dark: {
    paper: '#080b14',
    paper2: '#0c101b',
    surface: '#10141f',
    surface2: '#151a28',
    ink: '#eceef5',
    ink2: '#a8aec1',
    ink3: '#6d748b',
    rule: '#212737',
    rule2: '#2e3548',
    evolver: '#e5405c',
    explorer: '#169c8e',
    creator: '#c68610',
    accent: '#e5405c',
    accentInk: '#ff6f86',
    accentWash: '#2a1018',
    good: '#2fbf4a',
    bad: '#ef5a5a',
    domains: { rule: '#3987e5', constraint: '#d95926', percep: '#199e70', multi: '#c98500', long: '#d55181' },
    iters: ['#3b4154', '#7c3b3f', '#a65558', '#cf7577', '#f29a9a', '#e99696', '#feaaa9'],
    caps: { a: '#2cc3d4', b: '#9a6ef0', c: '#4a86ee', d: '#f0605a', e: '#66b452', f: '#f5b23f' },
  },
} as const;

export type Tokens = (typeof TOKENS)['light'] | (typeof TOKENS)['dark'];

export function useTokens() {
  const { theme } = useTheme();
  return { t: TOKENS[theme] as Tokens, theme };
}
