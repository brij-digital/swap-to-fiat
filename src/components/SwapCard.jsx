import { useState } from 'react';
import { 
  getAvailablePartners, 
  createRedirectOrder,
} from '../services/brij';

// Simple token list as requested
const TOKENS = [
  { id: 'SOL', name: 'SOL', icon: '◎', type: 'crypto', code: 'SOL' },
  { id: 'USDC', name: 'USDC', icon: '💵', type: 'crypto', code: 'USDC' },
  { id: 'EUR_SEPA', name: 'EUR with SEPA', icon: '🏦', type: 'fiat', code: 'EUR', paymentMethod: 'SEPA' },
  { id: 'EUR_CARD', name: 'EUR with Credit Card', icon: '💳', type: 'fiat', code: 'EUR', paymentMethod: 'CREDIT_CARD' },
];

const STEPS = {
  INPUT: 'input',
  PARTNERS: 'partners',
};

export default function SwapCard() {
  const [step, setStep] = useState(STEPS.INPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [fromToken, setFromToken] = useState(TOKENS[0]); // SOL by default
  const [toToken, setToToken] = useState(TOKENS[2]); // EUR SEPA by default
  const [amount, setAmount] = useState('50');
  
  // Partners
  const [partners, setPartners] = useState([]);

  // Fetch partners
  const handleGetPartners = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    // Can only swap crypto → fiat
    if (fromToken.type !== 'crypto') {
      setError('Select a crypto token to swap from');
      return;
    }
    if (toToken.type !== 'fiat') {
      setError('Select a fiat option to receive');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAvailablePartners({
        countryCode: 'ES', // Default to Spain
        rampType: 'OFFRAMP',
        fromCurrency: fromToken.code,
        toCurrency: toToken.code,
        paymentMethod: toToken.paymentMethod,
        fromAmount: amount,
        partnerTypes: ['REDIRECT'],
      });
      
      setPartners(result.partners || []);
      setStep(STEPS.PARTNERS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create order and redirect
  const handleCreateOrder = async (partner) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createRedirectOrder({
        countryCode: 'ES',
        rampType: 'OFFRAMP',
        fromCurrency: fromToken.code,
        toCurrency: toToken.code,
        paymentMethod: toToken.paymentMethod,
        fromAmount: amount,
        partnerId: partner.partnerId,
      });
      
      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(STEPS.INPUT);
  };

  // Filter available "to" tokens based on "from" selection
  const getAvailableToTokens = () => {
    if (fromToken.type === 'crypto') {
      // Can only swap to fiat
      return TOKENS.filter(t => t.type === 'fiat');
    }
    return [];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {step === STEPS.INPUT && 'Swap'}
            {step === STEPS.PARTNERS && 'Select Provider'}
          </h2>
          {step !== STEPS.INPUT && (
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step: Input */}
        {step === STEPS.INPUT && (
          <div className="space-y-4">
            {/* From */}
            <div className="bg-[#0d1117] rounded-xl p-4">
              <label className="text-sm text-gray-400 mb-2 block">You send</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-semibold outline-none"
                  placeholder="0.00"
                />
              </div>
              {/* Token selection */}
              <div className="mt-3 space-y-2">
                {TOKENS.filter(t => t.type === 'crypto').map((token) => (
                  <button
                    key={token.id}
                    onClick={() => {
                      setFromToken(token);
                      // Auto-select first fiat option if switching to crypto
                      if (toToken.type === 'crypto') {
                        setToToken(TOKENS.find(t => t.type === 'fiat'));
                      }
                    }}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition text-left ${
                      fromToken.id === token.id
                        ? 'bg-violet-600/20 border border-violet-500'
                        : 'bg-[#1c2128] hover:bg-[#262c36] border border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{token.icon}</span>
                    <span className="font-medium">{token.name}</span>
                    {fromToken.id === token.id && (
                      <svg className="w-5 h-5 text-violet-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="bg-[#30363d] rounded-full p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            {/* To */}
            <div className="bg-[#0d1117] rounded-xl p-4">
              <label className="text-sm text-gray-400 mb-2 block">You receive</label>
              <div className="space-y-2">
                {getAvailableToTokens().map((token) => (
                  <button
                    key={token.id}
                    onClick={() => setToToken(token)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition text-left ${
                      toToken.id === token.id
                        ? 'bg-violet-600/20 border border-violet-500'
                        : 'bg-[#1c2128] hover:bg-[#262c36] border border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{token.icon}</span>
                    <span className="font-medium">{token.name}</span>
                    {toToken.id === token.id && (
                      <svg className="w-5 h-5 text-violet-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleGetPartners}
              disabled={loading || fromToken.type !== 'crypto' || toToken.type !== 'fiat'}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 rounded-xl py-4 font-semibold transition"
            >
              {loading ? 'Loading...' : `Swap ${fromToken.name} → ${toToken.name}`}
            </button>

            {/* Powered by */}
            <p className="text-center text-xs text-gray-500">
              Powered by <span className="text-violet-400">Brij.fi</span>
            </p>
          </div>
        )}

        {/* Step: Partners */}
        {step === STEPS.PARTNERS && (
          <div className="space-y-3">
            <div className="bg-[#0d1117] rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-400">
                Converting <span className="text-white font-medium">{amount} {fromToken.name}</span>
              </p>
              <p className="text-sm text-gray-400">
                To <span className="text-white font-medium">{toToken.name}</span>
              </p>
            </div>
            
            {partners.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No providers available for this amount</p>
            ) : (
              partners.map((partner) => (
                <button
                  key={partner.partnerId}
                  onClick={() => handleCreateOrder(partner)}
                  disabled={loading}
                  className="w-full bg-[#0d1117] hover:bg-[#1c2128] border border-[#30363d] rounded-xl p-4 flex items-center gap-4 transition text-left"
                >
                  <img src={partner.icon} alt={partner.name} className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <div className="font-semibold">{partner.name}</div>
                    <div className="text-lg text-green-400 font-medium">
                      {parseFloat(partner.toAmount || 0).toFixed(2)} {toToken.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rate: 1 {fromToken.name} = {parseFloat(partner.rate || 0).toFixed(4)} {toToken.code}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-violet-400 text-sm">Select</div>
                    <svg className="w-5 h-5 text-gray-400 ml-auto mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
