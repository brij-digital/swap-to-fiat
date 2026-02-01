import { useState, useRef, useEffect } from 'react';
import { 
  getSupportedPaymentMethods,
  getAvailablePartners, 
  createRedirectOrder,
} from '../services/brij';

const BASE = import.meta.env.BASE_URL;

// Sell tokens (crypto) - hardcoded
const SELL_TOKENS = [
  { id: 'SOL', name: 'SOL', icon: `${BASE}sol.svg`, code: 'SOLANA_SOL' },
  { id: 'USDC', name: 'USDC', icon: `${BASE}usdc.svg`, code: 'SOLANA_USDC' },
];

function TokenDropdown({ tokens, selected, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-[#2a2a3e] rounded-full px-3 py-2">
        <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse"></div>
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#2a2a3e] hover:bg-[#3a3a4e] rounded-full px-3 py-2 transition"
      >
        <img src={selected.icon} alt={selected.name} className="w-6 h-6 rounded-full" />
        <span className="font-medium">{selected.name}</span>
        <svg className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[#1a1a2e] border border-[#3a3a4e] rounded-xl overflow-hidden z-50 min-w-[180px] shadow-xl">
          {tokens.map((token) => (
            <button
              key={token.id}
              onClick={() => { onSelect(token); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a3e] transition text-left ${
                selected.id === token.id ? 'bg-[#2a2a3e]' : ''
              }`}
            >
              <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full" />
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
  
  // Detected country from API
  const [countryCode, setCountryCode] = useState(null);
  
  // Dynamic buy tokens (fiat options from API)
  const [buyTokens, setBuyTokens] = useState([]);
  const [loadingBuyTokens, setLoadingBuyTokens] = useState(true);
  
  const [sellToken, setSellToken] = useState(SELL_TOKENS[1]); // USDC default
  const [buyToken, setBuyToken] = useState(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [bestPartner, setBestPartner] = useState(null);

  // Load payment methods on mount (API detects country from IP)
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoadingBuyTokens(true);
      try {
        const result = await getSupportedPaymentMethods({
          rampType: 'OFFRAMP',
          fromCurrency: sellToken.code,
          toCurrency: 'EUR',
        });
        
        // Store detected country
        if (result.countryCode) {
          setCountryCode(result.countryCode);
        }
        
        // Convert payment methods to buy tokens (max 3)
        const methods = (result.paymentMethods || []).slice(0, 3);
        const tokens = methods.map((pm) => ({
          id: pm.code,
          name: pm.name,
          icon: pm.icon,
          code: 'EUR',
          paymentMethod: pm.code,
        }));
        
        setBuyTokens(tokens);
        if (tokens.length > 0) {
          setBuyToken(tokens[0]);
        }
      } catch (err) {
        setError('Failed to load payment methods');
        console.error(err);
      } finally {
        setLoadingBuyTokens(false);
      }
    };
    
    loadPaymentMethods();
  }, [sellToken.code]);

  // Auto-fetch best quote when amount/tokens change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!sellAmount || parseFloat(sellAmount) <= 0 || !buyToken || !countryCode) {
        setBuyAmount('');
        setBestPartner(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getAvailablePartners({
          countryCode,
          rampType: 'OFFRAMP',
          fromCurrency: sellToken.code,
          toCurrency: buyToken.code,
          paymentMethod: buyToken.paymentMethod,
          fromAmount: sellAmount,
          partnerTypes: ['REDIRECT'],
        });

        const sortedPartners = (result.partners || []).sort(
          (a, b) => parseFloat(b.toAmount || 0) - parseFloat(a.toAmount || 0)
        );
        
        if (sortedPartners.length > 0) {
          const best = sortedPartners[0];
          setBestPartner(best);
          setBuyAmount(parseFloat(best.toAmount || 0).toFixed(2));
        } else {
          setBestPartner(null);
          setBuyAmount('0.00');
        }
      } catch (err) {
        setError(err.message);
        setBestPartner(null);
        setBuyAmount('');
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [sellAmount, sellToken, buyToken, countryCode]);

  const handleSwap = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) return;

    // Direct redirect to best partner
    if (bestPartner) {
      await handleCreateOrder(bestPartner);
    }
  };

  const handleCreateOrder = async (partner) => {
    setLoading(true);
    try {
      const result = await createRedirectOrder({
        countryCode,
        rampType: 'OFFRAMP',
        fromCurrency: sellToken.code,
        toCurrency: buyToken.code,
        paymentMethod: buyToken.paymentMethod,
        fromAmount: sellAmount,
        partnerId: partner.partnerId,
      });
      
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (!sellAmount) return 'Enter amount';
    if (bestPartner) {
      return `Withdraw via ${bestPartner.partnerName}`;
    }
    return 'Get Quote';
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
          {countryCode ? `🌍 ${countryCode}` : 'Detecting...'}
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
        <div className="text-gray-500 text-sm">
          {sellAmount ? `$${(parseFloat(sellAmount) * (sellToken.code === 'SOLANA_SOL' ? 150 : 1)).toFixed(2)}` : '$0.00'}
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="flex justify-center -my-3 relative z-10">
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-full p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Buy Box */}
      <div className="bg-[#131320] rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400 text-sm">Receive</span>
          {buyToken && (
            <TokenDropdown 
              tokens={buyTokens} 
              selected={buyToken} 
              onSelect={setBuyToken}
              loading={loadingBuyTokens}
            />
          )}
          {!buyToken && loadingBuyTokens && (
            <div className="flex items-center gap-2 bg-[#2a2a3e] rounded-full px-3 py-2">
              <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse"></div>
              <span className="text-gray-400">Loading...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-4xl font-light ${buyAmount ? 'text-white' : 'text-gray-600'}`}>
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              buyAmount || '0.0'
            )}
          </div>
          {bestPartner && (
            <img src={bestPartner.icon} alt={bestPartner.partnerName} className="w-6 h-6 rounded" title={`Best rate: ${bestPartner.partnerName}`} />
          )}
        </div>
        <div className="text-gray-500 text-sm">
          {buyAmount ? `€${parseFloat(buyAmount).toFixed(2)}` : '€0.00'}
        </div>
      </div>

      {/* Rate info */}
      {bestPartner && sellAmount && (
        <div className="mb-4 px-2 text-sm text-gray-400 flex justify-between">
          <span>Best rate via {bestPartner.partnerName}</span>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={handleSwap}
        disabled={loading || !sellAmount || !bestPartner}
        className="w-full bg-white text-black font-semibold rounded-2xl py-4 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {getButtonText()}
      </button>
    </div>
  );
}
