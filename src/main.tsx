import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './react/App';
import './styles.css';

const hote = document.getElementById('root');
if (!hote) throw new Error('#root introuvable');

createRoot(hote).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
