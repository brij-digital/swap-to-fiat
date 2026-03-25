import { useState, useRef, useEffect } from 'react';
import { 
  getSupportedPaymentMethods,
  getAvailablePartners, 
  createRedirectOrder,
} from '../services/brij';

const BASE = import.meta.env.BASE_URL;

// Currency symbols for display
const CURRENCY_SYMBOLS = {
  EUR: '€', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$', CHF: 'CHF', JPY: '¥',
  CZK: 'Kč', PLN: 'zł', SEK: 'kr', NOK: 'kr', DKK: 'kr', BRL: 'R$', MXN: '$',
  INR: '₹', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', ZAR: 'R', THB: '฿', PHP: '₱',
  IDR: 'Rp', MYR: 'RM', VND: '₫', TRY: '₺', ILS: '₪', AED: 'د.إ', SAR: '﷼',
  KRW: '₩', ARS: '$', COP: '$', CLP: '$', PEN: 'S/',
};

// ISO 3166-1 alpha-3 to alpha-2 mapping for flags
const COUNTRY_CODE_MAP = {
  ESP: 'es', FRA: 'fr', DEU: 'de', ITA: 'it', PRT: 'pt', NLD: 'nl', BEL: 'be',
  AUT: 'at', IRL: 'ie', FIN: 'fi', GRC: 'gr', LUX: 'lu', SVN: 'si', SVK: 'sk',
  EST: 'ee', LVA: 'lv', LTU: 'lt', MLT: 'mt', CYP: 'cy', GBR: 'gb', USA: 'us',
  AUS: 'au', CAN: 'ca', CHE: 'ch', JPN: 'jp', CZE: 'cz', POL: 'pl', SWE: 'se',
  NOR: 'no', DNK: 'dk', BRA: 'br', MEX: 'mx', IND: 'in', SGP: 'sg', HKG: 'hk',
  NZL: 'nz', ZAF: 'za', THA: 'th', PHL: 'ph', IDN: 'id', MYS: 'my', VNM: 'vn',
  TUR: 'tr', ISR: 'il', ARE: 'ae', SAU: 'sa', KOR: 'kr', ARG: 'ar', COL: 'co',
  CHL: 'cl', PER: 'pe', RUS: 'ru', CHN: 'cn', TWN: 'tw',
};

// Sell tokens (crypto) - hardcoded
const SELL_TOKENS = [
  { id: 'SOL', name: 'SOL', icon: `${BASE}sol.svg`, code: 'SOLANA_SOL' },
  { id: 'USDC', name: 'USDC', icon: `${BASE}usdc.svg`, code: 'SOLANA_USDC' },
];

// Hardcoded crypto buy options
const CRYPTO_BUY_TOKENS = [
  { id: 'USDC', name: 'USDC', icon: `${BASE}usdc.svg`, code: 'SOLANA_USDC', type: 'crypto' },
];

function TokenDropdown({ tokens, selected, onSelect, loading, showTabs = false }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fiat'); // 'crypto' or 'fiat'
  const ref = useRef(null);

  // Separate tokens by type
  const cryptoTokens = tokens.filter(t => t.type === 'crypto');
  const fiatTokens = tokens.filter(t => t.type === 'fiat');
  const hasBothTypes = cryptoTokens.length > 0 && fiatTokens.length > 0;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Set active tab based on selected token when opening
  useEffect(() => {
    if (open && selected) {
      setActiveTab(selected.type === 'crypto' ? 'crypto' : 'fiat');
    }
  }, [open, selected]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/8 bg-[#17263a] px-3 py-2 text-sm text-slate-300">
        <div className="h-6 w-6 animate-pulse rounded-full bg-slate-600"></div>
        <span>Loading...</span>
      </div>
    );
  }

  const displayTokens = showTabs && hasBothTypes 
    ? (activeTab === 'crypto' ? cryptoTokens : fiatTokens)
    : tokens;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-white/8 bg-[#17263a] px-3 py-2 text-slate-100 transition hover:border-cyan-400/30 hover:bg-[#1b2d45]"
      >
        <img src={selected.icon} alt={selected.name} className="h-6 w-6 rounded-full" />
        <span className="font-semibold tracking-[-0.02em]">{selected.name}</span>
        <svg className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1828]/95 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur-xl">
          {/* Tabs - only show if both types exist and showTabs is true */}
          {showTabs && hasBothTypes && (
            <div className="p-2">
              <div className="flex rounded-full bg-[#09111d] p-1">
                <button
                  onClick={() => setActiveTab('crypto')}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition ${
                    activeTab === 'crypto' 
                      ? 'bg-[#2a4f78] text-white shadow-[inset_0_1px_0_rgba(204,236,255,0.18)]' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Crypto
                </button>
                <button
                  onClick={() => setActiveTab('fiat')}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition ${
                    activeTab === 'fiat' 
                      ? 'bg-[#2a4f78] text-white shadow-[inset_0_1px_0_rgba(204,236,255,0.18)]' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fiat
                </button>
              </div>
            </div>
          )}
          
          {/* Token list */}
          <div className="max-h-[300px] overflow-y-auto">
            {displayTokens.map((token) => (
              <button
                key={token.id}
                onClick={() => { onSelect(token); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                  selected.id === token.id ? 'bg-[#16304d]' : 'hover:bg-[#12243a]'
                }`}
              >
                <img src={token.icon} alt={token.name} className="h-6 w-6 rounded-full" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate font-medium text-slate-100">{token.name}</span>
                  {token.type === 'fiat' && token.paymentMethod && (
                    <span className="truncate text-xs text-slate-500">{token.paymentMethod}</span>
                  )}
                </div>
                {selected.id === token.id && (
                  <svg className="h-4 w-4 flex-shrink-0 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Get flag icon URL from country code
function getFlagIcon(countryCode3) {
  const code2 = COUNTRY_CODE_MAP[countryCode3] || countryCode3.slice(0, 2).toLowerCase();
  return `https://flagcdn.com/w80/${code2}.png`;
}

export default function SwapCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Detected from API
  const [countryCode, setCountryCode] = useState(null);
  const [detectedCurrency, setDetectedCurrency] = useState(null);
  
  // Dynamic buy tokens
  const [buyTokens, setBuyTokens] = useState([]);
  const [loadingBuyTokens, setLoadingBuyTokens] = useState(true);
  
  const [sellToken, setSellToken] = useState(SELL_TOKENS[1]); // USDC default
  const [buyToken, setBuyToken] = useState(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [bestPartner, setBestPartner] = useState(null);

  // Load payment methods on mount - API auto-detects country AND currency!
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoadingBuyTokens(true);
      try {
        // API auto-detects country and returns the right currency
        const result = await getSupportedPaymentMethods({
          rampType: 'OFFRAMP',
          fromCurrency: sellToken.code,
          // No toCurrency - API will detect it!
        });
        
        const country = result.countryCode;
        const currency = result.toCurrency;
        
        setCountryCode(country);
        setDetectedCurrency(currency);
        
        // Convert payment methods to buy tokens (max 3)
        const methods = (result.paymentMethods || []).slice(0, 3);
        const flagIcon = getFlagIcon(country);
        
        const fiatTokens = methods.map((pm) => ({
          id: `${currency}_${pm.code}`,
          name: `${currency} ${pm.name}`,
          icon: flagIcon,
          code: currency,
          paymentMethod: pm.code,
          type: 'fiat',
        }));
        
        // Combine crypto + fiat options
        const allTokens = [...CRYPTO_BUY_TOKENS, ...fiatTokens];
        setBuyTokens(allTokens);
        
        // Default to first fiat option
        if (fiatTokens.length > 0) {
          setBuyToken(fiatTokens[0]);
        } else if (allTokens.length > 0) {
          setBuyToken(allTokens[0]);
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
      if (!sellAmount || parseFloat(sellAmount) <= 0 || !buyToken) {
        setBuyAmount('');
        setBestPartner(null);
        return;
      }

      // Crypto to crypto - no API call needed
      if (buyToken.type === 'crypto') {
        setBuyAmount(sellAmount);
        setBestPartner(null);
        return;
      }

      // Fiat - need country code
      if (!countryCode) {
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
    if (buyToken?.type === 'crypto') return 'Swap (Coming soon)';
    if (bestPartner) {
      return `Withdraw via ${bestPartner.partnerName}`;
    }
    return 'Get Quote';
  };

  const currencySymbol = CURRENCY_SYMBOLS[detectedCurrency] || detectedCurrency || '';

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#11233a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <svg className="h-5 w-5 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Liquidity router</p>
            <p className="m-0 mt-1 text-sm font-medium text-slate-300">
              {countryCode ? `Auto-detected ${countryCode} • ${detectedCurrency}` : 'Detecting region and fiat rail...'}
            </p>
          </div>
        </div>

        <div className="rounded-full border border-cyan-400/15 bg-[#11233a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
          Kamino mode
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-[2rem] border border-white/8 bg-[#0d1828]/90 p-4 shadow-[0_32px_90px_rgba(2,8,23,0.5)] backdrop-blur-xl">
        <div className="rounded-[1.75rem] border border-white/6 bg-[#142338] p-5 shadow-[inset_0_1px_0_rgba(191,233,255,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-400">You pay</span>
            <TokenDropdown
              tokens={SELL_TOKENS}
              selected={sellToken}
              onSelect={setSellToken}
            />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-5xl font-semibold tracking-[-0.05em] text-white outline-none placeholder:text-slate-600"
              />
              <div className="mt-3 text-sm text-slate-500">
                {sellAmount ? `$${(parseFloat(sellAmount) * (sellToken.code === 'SOLANA_SOL' ? 150 : 1)).toFixed(2)}` : '$0.00'}
              </div>
            </div>

            <div className="hidden rounded-2xl border border-white/6 bg-[#0e1c2c] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
              Available instantly
            </div>
          </div>
        </div>

        <div className="relative z-10 -my-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#13253b] shadow-[0_16px_32px_rgba(3,10,20,0.45)]">
            <svg className="h-6 w-6 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/6 bg-[#101f31] p-5 shadow-[inset_0_1px_0_rgba(191,233,255,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-400">You receive</span>
            {buyToken && (
              <TokenDropdown
                tokens={buyTokens}
                selected={buyToken}
                onSelect={setBuyToken}
                loading={loadingBuyTokens}
                showTabs={true}
              />
            )}
            {!buyToken && loadingBuyTokens && (
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-[#17263a] px-3 py-2 text-sm text-slate-300">
                <div className="h-6 w-6 animate-pulse rounded-full bg-slate-600"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>

          <div className="flex items-end gap-3">
            <div className={`text-5xl font-semibold tracking-[-0.05em] ${buyAmount ? 'text-white' : 'text-slate-600'}`}>
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                buyAmount || '0'
              )}
            </div>
            {bestPartner && (
              <div className="mb-2 flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
                <img src={bestPartner.icon} alt={bestPartner.partnerName} className="h-5 w-5 rounded" title={`Best rate: ${bestPartner.partnerName}`} />
                <span>{bestPartner.partnerName}</span>
              </div>
            )}
          </div>

          <div className="mt-3 text-sm text-slate-500">
            {buyAmount && buyToken?.type === 'fiat' ? `${currencySymbol}${parseFloat(buyAmount).toFixed(2)}` : '$0.00'}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-2xl border border-white/6 bg-[#0b1624] px-4 py-3 text-sm text-slate-400">
            {bestPartner && sellAmount ? `Best payout via ${bestPartner.partnerName}` : 'Enter an amount to fetch the best fiat payout.'}
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#0b1624] px-4 py-3 text-sm text-slate-400">
            {buyToken?.type === 'crypto' ? 'Crypto receive is preview-only for now.' : 'Redirect checkout after quote confirmation.'}
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={loading || !sellAmount || !bestPartner || buyToken?.type === 'crypto'}
          className="mt-4 w-full rounded-[1.4rem] bg-[linear-gradient(180deg,#396690_0%,#274c72_100%)] py-4 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(21,59,97,0.42)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
