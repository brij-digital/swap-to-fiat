import { useState, useEffect } from 'react';
import { 
  getSupportedPaymentMethods,
  getAvailablePartners, 
  createRedirectOrder,
} from '../services/brij';

const BASE = import.meta.env.BASE_URL;

// Chains data with icons
const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', color: '#627EEA' },
  { id: 'solana', name: 'Solana', icon: `${BASE}sol.svg`, color: '#9945FF' },
  { id: 'polygon', name: 'Polygon', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', icon: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg', color: '#FF0420' },
  { id: 'base', name: 'Base', icon: 'https://avatars.githubusercontent.com/u/108554348', color: '#0052FF' },
  { id: 'avalanche', name: 'Avalanche', icon: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg', color: '#E84142' },
  { id: 'bnb', name: 'BNB Chain', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg', color: '#F3BA2F' },
  { id: 'fiat', name: 'Fiat Currencies', icon: '💵', color: '#22C55E', isFiat: true },
];

// Tokens per chain
const CHAIN_TOKENS = {
  ethereum: [
    { id: 'ETH', name: 'ETH', fullName: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
    { id: 'USDC_ETH', name: 'USDC', fullName: 'USD Coin', icon: `${BASE}usdc.svg` },
    { id: 'USDT_ETH', name: 'USDT', fullName: 'Tether', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg' },
  ],
  solana: [
    { id: 'SOL', name: 'SOL', fullName: 'Solana', icon: `${BASE}sol.svg`, code: 'SOLANA_SOL' },
    { id: 'USDC_SOL', name: 'USDC', fullName: 'USD Coin', icon: `${BASE}usdc.svg`, code: 'SOLANA_USDC' },
  ],
  polygon: [
    { id: 'MATIC', name: 'MATIC', fullName: 'Polygon', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' },
    { id: 'USDC_POLY', name: 'USDC', fullName: 'USD Coin', icon: `${BASE}usdc.svg` },
  ],
  arbitrum: [
    { id: 'ETH_ARB', name: 'ETH', fullName: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
    { id: 'USDC_ARB', name: 'USDC', fullName: 'USD Coin', icon: `${BASE}usdc.svg` },
  ],
  optimism: [
    { id: 'ETH_OP', name: 'ETH', fullName: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
    { id: 'USDC_OP', name: 'USDC', fullName: 'USD Coin', icon: `${BASE}usdc.svg` },
  ],
  base: [
    { id: 'ETH_BASE', name: 'ETH', fullName: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
    { id: 'USDC_BASE', name: 'USDC', fullName: 'USD Coin', icon: `${BASE}usdc.svg` },
  ],
  avalanche: [
    { id: 'AVAX', name: 'AVAX', fullName: 'Avalanche', icon: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg' },
    { id: 'USDC_AVAX', name: 'USDC', fullName: 'USD Coin', icon: `${BASE}usdc.svg` },
  ],
  bnb: [
    { id: 'BNB', name: 'BNB', fullName: 'BNB', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg' },
    { id: 'USDT_BNB', name: 'USDT', fullName: 'Tether', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg' },
  ],
};

// Country code mapping for flags
const COUNTRY_CODE_MAP = {
  ESP: 'es', FRA: 'fr', DEU: 'de', ITA: 'it', PRT: 'pt', NLD: 'nl', BEL: 'be',
  AUT: 'at', IRL: 'ie', FIN: 'fi', GRC: 'gr', LUX: 'lu', GBR: 'gb', USA: 'us',
  AUS: 'au', CAN: 'ca', CHE: 'ch', JPN: 'jp', CZE: 'cz', POL: 'pl', SWE: 'se',
  NOR: 'no', DNK: 'dk', BRA: 'br', MEX: 'mx', IND: 'in', SGP: 'sg',
};

const CURRENCY_SYMBOLS = {
  EUR: '€', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$', CHF: 'CHF', JPY: '¥',
  CZK: 'Kč', PLN: 'zł', SEK: 'kr', NOK: 'kr', DKK: 'kr', BRL: 'R$', MXN: '$',
};

// Combined Chain + Token Selector Modal (Jumper-style)
function CombinedSelectorModal({ 
  isOpen, 
  onClose, 
  onSelectChain, 
  onSelectToken, 
  chains,
  selectedChain, 
  tokens, 
  selectedToken,
  loadingTokens,
}) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('chains'); // 'chains' or 'tokens'
  
  // Reset to chains view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('chains');
      setSearch('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const filteredChains = chains.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredTokens = tokens.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.fullName && t.fullName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleChainSelect = (chain) => {
    onSelectChain(chain);
    setView('tokens');
    setSearch('');
  };

  const handleTokenSelect = (token) => {
    onSelectToken(token);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <button 
            onClick={() => view === 'tokens' ? setView('chains') : onClose()} 
            className="text-gray-400 hover:text-white text-xl"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {view === 'chains' ? 'Select chain' : `Select token on ${selectedChain?.name}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
            <input
              type="text"
              placeholder={view === 'chains' ? "Search chain..." : "Search token..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-white placeholder-gray-500"
            />
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Chains View */}
        {view === 'chains' && (
          <div className="p-4 pt-0 grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {filteredChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  selectedChain?.id === chain.id 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-[#30363d] hover:border-[#50565d] bg-[#161b22]'
                }`}
                style={selectedChain?.id === chain.id ? { borderColor: chain.color } : {}}
              >
                {chain.isFiat ? (
                  <span className="text-3xl">{chain.icon}</span>
                ) : (
                  <img src={chain.icon} alt={chain.name} className="w-10 h-10 rounded-full" />
                )}
                <span className="text-sm font-medium text-center">{chain.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tokens View */}
        {view === 'tokens' && (
          <div className="max-h-[400px] overflow-y-auto">
            {loadingTokens ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No tokens available</div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#161b22] transition text-left ${
                    selectedToken?.id === token.id ? 'bg-[#161b22]' : ''
                  }`}
                >
                  {token.icon?.startsWith('http') || token.icon?.startsWith('/') ? (
                    <img src={token.icon} alt={token.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-[#30363d] flex items-center justify-center text-lg">
                      {token.icon}
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{token.name}</div>
                    <div className="text-sm text-gray-500">{token.fullName || token.name}</div>
                  </div>
                  {selectedToken?.id === token.id && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JumperSwap() {
  // Pay side state
  const [payChain, setPayChain] = useState(CHAINS.find(c => c.id === 'solana'));
  const [payToken, setPayToken] = useState(CHAIN_TOKENS.solana[1]); // USDC
  const [payAmount, setPayAmount] = useState('');
  
  // Receive side state
  const [receiveChain, setReceiveChain] = useState(CHAINS.find(c => c.id === 'fiat'));
  const [receiveToken, setReceiveToken] = useState(null);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [fiatTokens, setFiatTokens] = useState([]);
  const [loadingFiat, setLoadingFiat] = useState(false);
  
  // Modal state (combined chain+token selectors)
  const [showPaySelector, setShowPaySelector] = useState(false);
  const [showReceiveSelector, setShowReceiveSelector] = useState(false);
  
  // Quote state
  const [bestPartner, setBestPartner] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load fiat currencies when fiat chain is selected
  useEffect(() => {
    if (receiveChain?.isFiat) {
      loadFiatCurrencies();
    }
  }, [receiveChain]);

  const loadFiatCurrencies = async () => {
    setLoadingFiat(true);
    try {
      const result = await getSupportedPaymentMethods({
        rampType: 'OFFRAMP',
        fromCurrency: payToken?.code || 'SOLANA_USDC',
      });
      
      const methods = result.paymentMethods || [];
      const country = result.countryCode;
      const currency = result.toCurrency;
      const alpha2 = COUNTRY_CODE_MAP[country] || country?.toLowerCase().slice(0, 2) || 'eu';
      
      const tokens = methods.map((pm) => ({
        id: `${currency}_${pm.code}`,
        name: currency,
        fullName: `${currency} via ${pm.name}`,
        icon: `https://flagcdn.com/w40/${alpha2}.png`,
        code: currency,
        paymentMethod: pm.code,
        countryCode: country,
        type: 'fiat',
      }));
      
      setFiatTokens(tokens);
      if (tokens.length > 0 && !receiveToken) {
        setReceiveToken(tokens[0]);
      }
    } catch (err) {
      console.error('Failed to load fiat currencies:', err);
    } finally {
      setLoadingFiat(false);
    }
  };

  // Get quote when amount changes
  useEffect(() => {
    if (!payAmount || !receiveChain?.isFiat || !receiveToken) {
      setReceiveAmount('');
      setBestPartner(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await getAvailablePartners({
          countryCode: receiveToken.countryCode,
          rampType: 'OFFRAMP',
          fromCurrency: payToken?.code || 'SOLANA_USDC',
          toCurrency: receiveToken.code,
          paymentMethod: receiveToken.paymentMethod,
          fromAmount: payAmount,
          partnerTypes: ['REDIRECT'],
        });
        
        const partners = result.partners || [];
        const sortedPartners = partners.sort(
          (a, b) => parseFloat(b.toAmount || 0) - parseFloat(a.toAmount || 0)
        );
        
        if (sortedPartners.length > 0) {
          const best = sortedPartners[0];
          setBestPartner(best);
          setReceiveAmount(parseFloat(best.toAmount || 0).toFixed(2));
        } else {
          setBestPartner(null);
          setReceiveAmount('');
        }
      } catch (err) {
        console.error('Quote error:', err);
        setBestPartner(null);
        setReceiveAmount('');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [payAmount, payToken, receiveToken, receiveChain]);

  const handleSwap = async () => {
    if (!bestPartner || !receiveChain?.isFiat) return;
    
    try {
      const result = await createRedirectOrder({
        countryCode: receiveToken.countryCode,
        rampType: 'OFFRAMP',
        fromCurrency: payToken?.code || 'SOLANA_USDC',
        toCurrency: receiveToken.code,
        paymentMethod: receiveToken.paymentMethod,
        fromAmount: payAmount,
        partnerId: bestPartner.partnerId,
      });
      
      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
      }
    } catch (err) {
      console.error('Order error:', err);
      alert('Failed to create order');
    }
  };

  const getReceiveTokens = () => {
    if (receiveChain?.isFiat) return fiatTokens;
    return CHAIN_TOKENS[receiveChain?.id] || [];
  };

  const currencySymbol = receiveToken?.code ? (CURRENCY_SYMBOLS[receiveToken.code] || '') : '';

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-[#161b22] border border-[#30363d] rounded-xl p-1">
            <button className="px-4 py-2 bg-[#30363d] rounded-lg text-white font-medium">Market</button>
            <button className="px-4 py-2 text-gray-400 hover:text-white">Limit</button>
            <button className="px-4 py-2 text-gray-400 hover:text-white">P2P</button>
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-[#30363d] rounded-lg hover:bg-[#161b22]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            <button className="p-2 border border-[#30363d] rounded-lg hover:bg-[#161b22]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button className="p-2 border border-[#30363d] rounded-lg hover:bg-[#161b22]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden">
          {/* You Pay Section */}
          <div className="p-4 border-b border-[#30363d]">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>You pay</span>
              <span>Balance: 0 {payToken?.name}</span>
            </div>
            <div className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-xl p-3">
              <button 
                onClick={() => setShowPaySelector(true)}
                className="flex items-center gap-2 hover:opacity-80 bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d]"
              >
                <img src={payChain?.icon} alt={payChain?.name} className="w-6 h-6 rounded-full" />
                <span className="font-semibold">{payToken?.name}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-xl font-light outline-none text-right"
              />
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-3 relative z-10">
            <button className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2 hover:bg-[#161b22]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* You Receive Section */}
          <div className="p-4 border-b border-[#30363d]">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>You receive</span>
              {receiveChain?.isFiat && bestPartner && (
                <span className="text-green-400">via {bestPartner.partnerName}</span>
              )}
            </div>
            <div className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-xl p-3">
              <button 
                onClick={() => setShowReceiveSelector(true)}
                className="flex items-center gap-2 hover:opacity-80 bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d]"
                disabled={loadingFiat}
              >
                {receiveChain?.isFiat ? (
                  <span className="text-xl">{receiveChain?.icon}</span>
                ) : (
                  <img src={receiveChain?.icon} alt={receiveChain?.name} className="w-6 h-6 rounded-full" />
                )}
                {loadingFiat ? (
                  <span className="text-gray-400">Loading...</span>
                ) : receiveToken ? (
                  <span className="font-semibold">{receiveToken.name}</span>
                ) : (
                  <span className="text-gray-400">Select</span>
                )}
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="flex-1 text-xl font-light text-right">
                {loading ? (
                  <span className="animate-pulse text-gray-500">...</span>
                ) : receiveAmount ? (
                  <span>{currencySymbol}{receiveAmount}</span>
                ) : (
                  <span className="text-gray-600">0</span>
                )}
              </div>
            </div>
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
            <span className="text-green-400 text-sm font-medium">+ 0 POINTS</span>
            {bestPartner && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>ETA: 2m</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded bg-[#161b22] border-[#30363d]" />
              <span>Trade and Send to Another Address</span>
            </label>
            <button className="flex items-center gap-1 hover:text-white">
              Routing
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* CTA Button */}
          <div className="p-4">
            <button
              onClick={handleSwap}
              disabled={!bestPartner || loading || !payAmount}
              className="w-full bg-[#c6f432] text-black font-semibold rounded-xl py-4 hover:bg-[#d4ff3f] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {!receiveChain?.isFiat ? 'Select Fiat Currency' : 
               !payAmount ? 'Enter amount' :
               loading ? 'Getting quote...' :
               !bestPartner ? 'No route found' :
               `Cash out to ${receiveToken?.code || 'Fiat'}`}
            </button>
          </div>
        </div>

        {/* Powered by */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Powered by <a href="https://brij.fi" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Brij.fi</a>
        </div>
      </div>

      {/* Combined Chain + Token Selector Modals */}
      <CombinedSelectorModal
        isOpen={showPaySelector}
        onClose={() => setShowPaySelector(false)}
        chains={CHAINS.filter(c => !c.isFiat)} // Pay side: only crypto chains
        selectedChain={payChain}
        onSelectChain={(chain) => {
          setPayChain(chain);
          setPayToken(CHAIN_TOKENS[chain.id]?.[0] || null);
        }}
        tokens={CHAIN_TOKENS[payChain?.id] || []}
        selectedToken={payToken}
        onSelectToken={setPayToken}
      />
      
      <CombinedSelectorModal
        isOpen={showReceiveSelector}
        onClose={() => setShowReceiveSelector(false)}
        chains={CHAINS} // Receive side: all chains including fiat
        selectedChain={receiveChain}
        onSelectChain={(chain) => {
          setReceiveChain(chain);
          if (!chain.isFiat) {
            setReceiveToken(CHAIN_TOKENS[chain.id]?.[0] || null);
          } else {
            setReceiveToken(fiatTokens[0] || null);
          }
        }}
        tokens={getReceiveTokens()}
        selectedToken={receiveToken}
        onSelectToken={setReceiveToken}
        loadingTokens={loadingFiat && receiveChain?.isFiat}
      />
    </div>
  );
}
