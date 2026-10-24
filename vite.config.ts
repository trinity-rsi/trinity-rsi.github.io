import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Keep only what the page renders:
 * - KaTeX: woff2 only (every current browser), drop the .woff / .ttf fallbacks;
 * - Fontsource: latin + latin-ext subsets only (the page has no Cyrillic, Greek or Vietnamese text).
 * The normal build would never download the dropped files anyway; this mainly keeps the
 * single-file build small.
 */
function trimFonts(): Plugin {
  return {
    name: 'trim-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (/katex(\.min)?\.css$/.test(id)) {
        return code.replace(/,\s*url\([^)]*?\.woff\)\s*format\("woff"\)\s*,\s*url\([^)]*?\.ttf\)\s*format\("truetype"\)/g, '');
      }
      if (/@fontsource-variable\/.+\.css$/.test(id)) {
        return code.replace(
          /\/\*[^*]*-(?:cyrillic-ext|cyrillic|greek-ext|greek|vietnamese)-[^*]*\*\/\s*@font-face\s*\{[^}]*\}/g,
          ''
        );
      }
      return null;
    },
  };
}

/** single-file build: inline the favicon too, so the HTML has no external references at all */
function inlineFavicon(): Plugin {
  return {
    name: 'inline-favicon',
    transformIndexHtml(html) {
      const png = readFileSync(fileURLToPath(new URL('./public/favicon.png', import.meta.url))).toString('base64');
      return html
        .replace('href="./favicon.png"', `href="data:image/png;base64,${png}"`)
        .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '');
    },
  };
}

// `npm run build`        -> dist/         (static site for GitHub Pages / Vercel / Netlify / any server)
// `npm run build:single` -> dist-single/  (one self-contained index.html that opens by double-click)
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [trimFonts(), react(), tailwindcss(), ...(single ? [inlineFavicon(), viteSingleFile({ removeViteModuleLoader: true })] : [])],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
      dedupe: ['react', 'react-dom'],
    },
    // pre-bundle everything up front so the dev server never re-optimises mid-session
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'motion/react',
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/SplitText',
        '@gsap/react',
        '@hugeicons/react',
        '@hugeicons/core-free-icons',
        'katex',
      ],
    },
    build: single
      ? { outDir: 'dist-single', assetsInlineLimit: () => true, cssCodeSplit: false, chunkSizeWarningLimit: 100000, copyPublicDir: false }
      : { outDir: 'dist', chunkSizeWarningLimit: 4000 },
  };
});
