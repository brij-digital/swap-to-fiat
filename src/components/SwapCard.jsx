import { useState, useRef, useEffect } from 'react';
import { 
  getAvailablePartners, 
  createRedirectOrder,
} from '../services/brij';

// Token definitions with icons
const SELL_TOKENS = [
  { id: 'SOL', name: 'SOL', icon: '/sol.svg', type: 'crypto', code: 'SOL' },
  { id: 'USDC', name: 'USDC', icon: '/usdc.svg', type: 'crypto', code: 'USDC' },
];

const BUY_TOKENS = [
  { id: 'USDC', name: 'USDC', icon: '/usdc.svg', type: 'crypto', code: 'USDC' },
  { id: 'EUR_SEPA', name: 'EUR (SEPA)', icon: '/eur.svg', type: 'fiat', code: 'EUR', paymentMethod: 'SEPA' },
  { id: 'EUR_CARD', name: 'EUR (Card)', icon: '/card.svg', type: 'fiat', code: 'EUR', paymentMethod: 'CREDIT_CARD' },
];

function TokenDropdown({ tokens, selected, onSelect, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#2a2a3e] hover:bg-[#3a3a4e] rounded-full px-3 py-2 transition"
      >
        <img src={selected.icon} alt={selected.name} className="w-6 h-6" />
        <span className="font-medium">{selected.name}</span>
        <svg className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[#1a1a2e] border border-[#3a3a4e] rounded-xl overflow-hidden z-50 min-w-[160px] shadow-xl">
          {tokens.map((token) => (
            <button
              key={token.id}
              onClick={() => { onSelect(token); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a3e] transition text-left ${
                selected.id === token.id ? 'bg-[#2a2a3e]' : ''
              }`}
            >
              <img src={token.icon} alt={token.name} className="w-6 h-6" />
              <span>{token.name}</span>
              {selected.id === token.id && (
                <svg className="w-4 h-4 text-violet-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SwapCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [sellToken, setSellToken] = useState(SELL_TOKENS[0]);
  const [buyToken, setBuyToken] = useState(BUY_TOKENS[1]); // EUR SEPA default
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  
  // Partners modal
  const [showPartners, setShowPartners] = useState(false);
  const [partners, setPartners] = useState([]);

  const sellUsdValue = sellAmount ? `$${(parseFloat(sellAmount) * 150).toFixed(2)}` : '$0.00';
  const buyUsdValue = buyAmount ? `$${parseFloat(buyAmount).toFixed(2)}` : '$0.00';

  const handleSwapTokens = () => {
    // Only swap if both tokens exist in both lists
    const newSell = SELL_TOKENS.find(t => t.id === buyToken.id);
    const newBuy = BUY_TOKENS.find(t => t.id === sellToken.id);
    if (newSell && newBuy) {
      setSellToken(newSell);
      setBuyToken(newBuy);
      setSellAmount(buyAmount);
      setBuyAmount(sellAmount);
    }
  };

  const handleGetQuote = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) return;
    
    // Only works for crypto → fiat
    if (buyToken.type !== 'fiat') {
      setBuyAmount(sellAmount); // Mock 1:1 for demo
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAvailablePartners({
        countryCode: 'ES',
        rampType: 'OFFRAMP',
        fromCurrency: sellToken.code,
        toCurrency: buyToken.code,
        paymentMethod: buyToken.paymentMethod,
        fromAmount: sellAmount,
        partnerTypes: ['REDIRECT'],
      });
      
      setPartners(result.partners || []);
      if (result.partners?.length > 0) {
        setBuyAmount(parseFloat(result.partners[0].toAmount || 0).toFixed(2));
      }
      setShowPartners(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (partner) => {
    setLoading(true);
    try {
      const result = await createRedirectOrder({
        countryCode: 'ES',
        rampType: 'OFFRAMP',
        fromCurrency: sellToken.code,
        toCurrency: buyToken.code,
        paymentMethod: buyToken.paymentMethod,
        fromAmount: sellAmount,
        partnerId: partner.partnerId,
      });
      
      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowPartners(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button className="p-2 bg-[#1a1a2e] rounded-full hover:bg-[#2a2a3e] transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <div className="bg-[#1a1a2e] rounded-full px-4 py-2 text-sm text-gray-300">
          Slippage: Auto
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Sell Box */}
      <div className="bg-[#131320] border border-[#2a2a3e] rounded-2xl p-4 mb-2">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400 text-sm">Sell</span>
          <TokenDropdown 
            tokens={SELL_TOKENS} 
            selected={sellToken} 
            onSelect={setSellToken}
          />
        </div>
        <input
          type="number"
          value={sellAmount}
          onChange={(e) => setSellAmount(e.target.value)}
          placeholder="0.0"
          className="w-full bg-transparent text-4xl font-light outline-none text-white placeholder-gray-600 mb-2"
        />
        <div className="text-gray-500 text-sm">{sellUsdValue}</div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-3 relative z-10">
        <button 
          onClick={handleSwapTokens}
          className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-full p-2 hover:bg-[#2a2a3e] transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Buy Box */}
      <div className="bg-[#131320] rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400 text-sm">Buy</span>
          <TokenDropdown 
            tokens={BUY_TOKENS} 
            selected={buyToken} 
            onSelect={setBuyToken}
          />
        </div>
        <div className="text-4xl font-light text-gray-500 mb-2">
          {buyAmount || '0.0'}
        </div>
        <div className="text-gray-500 text-sm">{buyUsdValue}</div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleGetQuote}
        disabled={loading || !sellAmount}
        className="w-full bg-white text-black font-semibold rounded-2xl py-4 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Loading...' : 'Connect Wallet'}
      </button>

      {/* Partners Modal */}
      {showPartners && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Select Provider</h3>
              <button onClick={() => setShowPartners(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-sm text-gray-400 mb-4">
              {sellAmount} {sellToken.name} → {buyToken.name}
            </div>

            {partners.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No providers available</p>
            ) : (
              <div className="space-y-3">
                {partners.map((partner) => (
                  <button
                    key={partner.partnerId}
                    onClick={() => handleCreateOrder(partner)}
                    className="w-full bg-[#131320] hover:bg-[#2a2a3e] rounded-xl p-4 flex items-center gap-4 transition text-left"
                  >
                    <img src={partner.icon} alt={partner.name} className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <div className="font-medium">{partner.name}</div>
                      <div className="text-green-400">{parseFloat(partner.toAmount || 0).toFixed(2)} {buyToken.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
