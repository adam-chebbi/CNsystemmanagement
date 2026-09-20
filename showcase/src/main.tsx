import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './lib/theme';
import { Router } from './lib/router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  </StrictMode>
);
