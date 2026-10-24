import { createRoot } from 'react-dom/client';
import '@fontsource-variable/hubot-sans/wdth.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import '@fontsource-variable/source-serif-4/opsz-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import 'katex/dist/katex.min.css';
import './index.css';
import { ThemeProvider } from './theme/ThemeProvider';
import App from './App';

createRoot(document.getElementById('root')!).render(
  // no StrictMode: several WebGL effects release their context on unmount, and StrictMode's
  // dev-only double mount would hand them a lost context
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
