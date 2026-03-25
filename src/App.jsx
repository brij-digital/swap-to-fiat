import { useState, useEffect } from 'react';
import SwapCard from './components/SwapCard';
import JumperSwap from './components/JumperSwap';
import './App.css';

function App() {
  // Simple hash routing
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [rampMode, setRampMode] = useState('OFFRAMP');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Jumper-style page
  if (route === '#/jumper') {
    return <JumperSwap />;
  }

  // Default Kamino-style page
  return (
    <div className="kamino-app min-h-screen px-4 py-6">
      <div className="kamino-orb kamino-orb-left" />
      <div className="kamino-orb kamino-orb-right" />

      <div className="kamino-switcher">
        <button
          type="button"
          onClick={() => setRampMode('OFFRAMP')}
          className={`kamino-switch-pill ${rampMode === 'OFFRAMP' ? 'is-active' : ''}`}
        >
          Off-Ramp
        </button>
        <button
          type="button"
          onClick={() => setRampMode('ONRAMP')}
          className={`kamino-switch-pill ${rampMode === 'ONRAMP' ? 'is-active' : ''}`}
        >
          On-Ramp
        </button>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <div className="kamino-badge">Brij Off-Ramp Demo</div>
          </div>

          <SwapCard rampMode={rampMode} />

          <div className="mt-6 text-center text-xs text-slate-500">
            <p>
              Powered by{' '}
              <a
                href="https://brij.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 transition hover:text-white"
              >
                Brij.fi
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
