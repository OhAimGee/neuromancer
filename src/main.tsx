import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Les deux sous-ensembles sont necessaires pour chaque police : latin-ext ne
// contient que le complement accentue. Sans latin, les lettres de base
// retombent sur une police systeme — defaut discret, tres visible sur le A.
import '@fontsource/jersey-10/latin-400.css';
import '@fontsource/jersey-10/latin-ext-400.css';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/silkscreen/latin-ext-400.css';

import { App } from './react/App';
import './styles.css';

const hote = document.getElementById('root');
if (!hote) throw new Error('#root introuvable');

createRoot(hote).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
