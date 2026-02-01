import SwapCard from './components/SwapCard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Swap to Fiat
          </span>
        </h1>
        <p className="text-gray-400">Convert your Solana tokens to fiat instantly</p>
      </div>

      {/* Swap Card */}
      <SwapCard />

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Demo integration with <a href="https://brij.fi" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Brij.fi</a></p>
        <p className="mt-1">Off-ramp API for Solana</p>
      </div>
    </div>
  );
}

export default App;
