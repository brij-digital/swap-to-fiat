import SwapCard from './components/SwapCard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a14] to-[#12121f] flex flex-col items-center justify-center p-4">
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
