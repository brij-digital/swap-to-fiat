import { useState, useEffect } from 'react';
import SwapCard from './components/SwapCard';
import JumperSwap from './components/JumperSwap';
import './App.css';

function App() {
  // Simple hash routing
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Jumper-style page
  if (route === '#/jumper') {
    return <JumperSwap />;
  }

  // Default Jupiter-style page
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a14] to-[#12121f] flex flex-col items-center justify-center p-4">
      {/* Version switcher */}
      <div className="absolute top-4 right-4 flex gap-2">
        <a 
          href="#/" 
          className={`px-3 py-1 rounded-full text-sm transition ${route === '#/' || route === '' ? 'bg-violet-600 text-white' : 'bg-[#2a2a3e] text-gray-400 hover:text-white'}`}
        >
          Jupiter
        </a>
        <a 
          href="#/jumper" 
          className={`px-3 py-1 rounded-full text-sm transition ${route === '#/jumper' ? 'bg-violet-600 text-white' : 'bg-[#2a2a3e] text-gray-400 hover:text-white'}`}
        >
          Jumper
        </a>
      </div>

      {/* Swap Card */}
      <SwapCard />

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-600">
        <p>Powered by <a href="https://brij.fi" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Brij.fi</a></p>
      </div>
    </div>
  );
}

export default App;
