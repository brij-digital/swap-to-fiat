import { useEffect, useMemo, useState } from 'react';
import {
  createRedirectOrder,
  getAvailablePartners,
  getSupportedPaymentMethods,
} from '../services/brij';

const BASE = import.meta.env.BASE_URL;

const CURRENCY_SYMBOLS = {
  EUR: '€', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$', CHF: 'CHF', JPY: '¥',
  CZK: 'Kč', PLN: 'zł', SEK: 'kr', NOK: 'kr', DKK: 'kr', BRL: 'R$', MXN: '$',
  INR: '₹', SGD: 'S$', HKD: 'HK$', NZD: 'N$', ZAR: 'R', THB: '฿', PHP: '₱',
  IDR: 'Rp', MYR: 'RM', VND: '₫', TRY: '₺', ILS: '₪', AED: 'د.إ', SAR: '﷼',
  KRW: '₩', ARS: '$', COP: '$', CLP: '$', PEN: 'S/',
};

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

const CRYPTO_TOKENS = [
  { id: 'SOL', name: 'SOL', icon: `${BASE}sol.svg`, code: 'SOLANA_SOL', type: 'crypto', decimals: 4 },
  { id: 'USDC', name: 'USDC', icon: `${BASE}usdc.svg`, code: 'SOLANA_USDC', type: 'crypto', decimals: 2 },
];

function TokenSelectorButton({ selected, loading, onClick }) {
  if (loading || !selected) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/8 bg-[#17263a] px-3 py-2 text-sm text-slate-300">
        <div className="h-6 w-6 animate-pulse rounded-full bg-slate-600"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-white/8 bg-[#17263a] px-3 py-2 text-slate-100 transition hover:border-cyan-400/30 hover:bg-[#1b2d45]"
    >
      <img src={selected.icon} alt={selected.name} className="h-6 w-6 rounded-full object-cover" />
      <span className="max-w-[12rem] truncate font-semibold tracking-[-0.02em]">{selected.name}</span>
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function TokenSelectorModal({ isOpen, title, tokens, selected, loading, onClose, onSelect }) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const filteredTokens = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return tokens;
    }

    return tokens.filter((token) =>
      token.name.toLowerCase().includes(query) ||
      token.code?.toLowerCase().includes(query) ||
      token.subtitle?.toLowerCase().includes(query) ||
      token.paymentMethod?.toLowerCase().includes(query),
    );
  }, [search, tokens]);

  const quickPicks = filteredTokens.slice(0, 6);
  const fiatTokens = filteredTokens.filter((token) => token.type === 'fiat');
  const cryptoTokens = filteredTokens.filter((token) => token.type !== 'fiat');

  if (!isOpen) {
    return null;
  }

  const renderTokenRow = (token) => (
    <button
      key={token.id}
      type="button"
      onClick={() => {
        onSelect(token);
        onClose();
      }}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
        selected?.id === token.id ? 'bg-[#16304d]' : 'hover:bg-[#12243a]'
      }`}
    >
      <img src={token.icon} alt={token.name} className="h-10 w-10 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-slate-50">{token.name}</div>
        {token.subtitle && (
          <div className="truncate text-sm text-slate-500">{token.subtitle}</div>
        )}
      </div>
      {selected?.id === token.id && (
        <svg className="h-5 w-5 flex-shrink-0 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#020814]/80 p-4 pt-10 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-[2rem] border border-white/8 bg-[#121f35] p-5 shadow-[0_30px_120px_rgba(2,8,23,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Asset Picker</div>
            <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/8 bg-[#16253b] px-4 py-2 text-sm text-slate-300 transition hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-[1.4rem] border border-white/8 bg-[#16253b] px-4 py-4">
          <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search token or fiat"
            className="w-full bg-transparent text-2xl font-medium text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        {loading ? (
          <div className="rounded-[1.5rem] border border-white/8 bg-[#16253b] px-5 py-8 text-center text-slate-400">
            Loading assets...
          </div>
        ) : (
          <>
            {quickPicks.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-3">
                {quickPicks.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => {
                      onSelect(token);
                      onClose();
                    }}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      selected?.id === token.id
                        ? 'border-cyan-300/40 bg-[#1b3352] text-white'
                        : 'border-white/10 bg-[#1a2a43] text-slate-100 hover:border-cyan-400/25'
                    }`}
                  >
                    <img src={token.icon} alt={token.name} className="h-7 w-7 rounded-full object-cover" />
                    <span className="font-semibold">{token.name}</span>
                  </button>
                ))}
              </div>
            )}

            {fiatTokens.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Fiat</div>
                <div className="rounded-[1.5rem] border border-white/8 bg-[#16253b] p-2">
                  {fiatTokens.map(renderTokenRow)}
                </div>
              </div>
            )}

            {cryptoTokens.length > 0 && (
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {fiatTokens.length > 0 ? 'Crypto' : 'All Assets'}
                </div>
                <div className="rounded-[1.5rem] border border-white/8 bg-[#16253b] p-2">
                  {cryptoTokens.map(renderTokenRow)}
                </div>
              </div>
            )}

            {filteredTokens.length === 0 && (
              <div className="rounded-[1.5rem] border border-white/8 bg-[#16253b] px-5 py-8 text-center text-slate-400">
                No asset found for this search.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getFlagIcon(countryCode3) {
  const code2 = COUNTRY_CODE_MAP[countryCode3] || countryCode3?.slice(0, 2).toLowerCase() || 'eu';
  return `https://flagcdn.com/w80/${code2}.png`;
}

function createFiatOptions(currency, paymentMethods, countryCode) {
  const fallbackIcon = getFlagIcon(countryCode);
  return paymentMethods.map((paymentMethod) => ({
    id: `${currency}_${paymentMethod.code}`,
    name: `${currency} ${paymentMethod.name}`,
    subtitle: paymentMethod.code,
    icon: paymentMethod.icon || fallbackIcon,
    code: currency,
    paymentMethod: paymentMethod.code,
    type: 'fiat',
    decimals: 2,
  }));
}

function formatTokenAmount(value, token) {
  const amount = Number.parseFloat(value || '0');
  if (!Number.isFinite(amount)) {
    return '0';
  }

  const decimals = token?.type === 'fiat' ? 2 : token?.decimals || 4;
  return amount.toFixed(decimals);
}

function formatFiatValue(value, currency) {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const amount = Number.parseFloat(value || '0');
  const safeAmount = Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
  return `${symbol}${safeAmount}`;
}

export default function SwapCard() {
  const [rampMode, setRampMode] = useState('OFFRAMP');
  const isOnRamp = rampMode === 'ONRAMP';
  const modeLabel = isOnRamp ? 'On-ramp' : 'Off-ramp';
  const [activeSelector, setActiveSelector] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countryCode, setCountryCode] = useState(null);
  const [detectedCurrency, setDetectedCurrency] = useState(null);

  const [payTokens, setPayTokens] = useState(CRYPTO_TOKENS);
  const [receiveTokens, setReceiveTokens] = useState([]);
  const [loadingPayTokens, setLoadingPayTokens] = useState(false);
  const [loadingReceiveTokens, setLoadingReceiveTokens] = useState(true);

  const [payToken, setPayToken] = useState(CRYPTO_TOKENS[1]);
  const [receiveToken, setReceiveToken] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [bestPartner, setBestPartner] = useState(null);

  const selectedCryptoPayToken = CRYPTO_TOKENS.find((token) => token.code === payToken?.code) || CRYPTO_TOKENS[1];
  const selectedCryptoReceiveToken = CRYPTO_TOKENS.find((token) => token.code === receiveToken?.code) || CRYPTO_TOKENS[1];

  const toggleRampMode = () => {
    setActiveSelector(null);
    setRampMode((currentMode) => (currentMode === 'ONRAMP' ? 'OFFRAMP' : 'ONRAMP'));
  };

  const paySelectorTokens = isOnRamp ? payTokens : CRYPTO_TOKENS;
  const paySelectorSelected = isOnRamp ? payToken : selectedCryptoPayToken;
  const paySelectorLoading = isOnRamp ? loadingPayTokens : false;

  const receiveSelectorTokens = isOnRamp ? CRYPTO_TOKENS : receiveTokens;
  const receiveSelectorSelected = isOnRamp ? selectedCryptoReceiveToken : receiveToken;
  const receiveSelectorLoading = isOnRamp ? false : loadingReceiveTokens;

  const selectorTitle = activeSelector === 'pay' ? 'Select asset you pay with' : 'Select asset you receive';
  const selectorTokens = activeSelector === 'pay' ? paySelectorTokens : receiveSelectorTokens;
  const selectorSelected = activeSelector === 'pay' ? paySelectorSelected : receiveSelectorSelected;
  const selectorLoading = activeSelector === 'pay' ? paySelectorLoading : receiveSelectorLoading;

  const handleSelectToken = (token) => {
    if (activeSelector === 'pay') {
      setPayToken(token);
      return;
    }

    setReceiveToken(token);
  };

  useEffect(() => {
    setError(null);
    setLoading(false);
    setBestPartner(null);
    setPayAmount('');
    setReceiveAmount('');

    if (isOnRamp) {
      setReceiveTokens(CRYPTO_TOKENS);
      setReceiveToken(selectedCryptoReceiveToken);
      setPayTokens([]);
      setPayToken(null);
      setLoadingPayTokens(true);
      setLoadingReceiveTokens(false);
    } else {
      setPayTokens(CRYPTO_TOKENS);
      setPayToken(selectedCryptoPayToken);
      setReceiveTokens([]);
      setReceiveToken(null);
      setLoadingPayTokens(false);
      setLoadingReceiveTokens(true);
    }
  }, [isOnRamp, selectedCryptoPayToken, selectedCryptoReceiveToken]);

  useEffect(() => {
    let ignore = false;

    const loadOptions = async () => {
      try {
        setError(null);

        if (isOnRamp) {
          const targetToken = selectedCryptoReceiveToken;
          const result = await getSupportedPaymentMethods({
            rampType: 'ONRAMP',
            toCurrency: targetToken.code,
          });

          if (ignore) {
            return;
          }

          const fiatOptions = createFiatOptions(
            result.fromCurrency,
            (result.paymentMethods || []).slice(0, 4),
            result.countryCode,
          );

          setCountryCode(result.countryCode);
          setDetectedCurrency(result.fromCurrency);
          setPayTokens(fiatOptions);
          setPayToken((current) => fiatOptions.find((option) => option.id === current?.id) || fiatOptions[0] || null);
        } else {
          const sourceToken = selectedCryptoPayToken;
          const result = await getSupportedPaymentMethods({
            rampType: 'OFFRAMP',
            fromCurrency: sourceToken.code,
          });

          if (ignore) {
            return;
          }

          const fiatOptions = createFiatOptions(
            result.toCurrency,
            (result.paymentMethods || []).slice(0, 4),
            result.countryCode,
          );

          setCountryCode(result.countryCode);
          setDetectedCurrency(result.toCurrency);
          setReceiveTokens(fiatOptions);
          setReceiveToken((current) => fiatOptions.find((option) => option.id === current?.id) || fiatOptions[0] || null);
        }
      } catch (err) {
        if (!ignore) {
          setError('Failed to load payment methods');
        }
      } finally {
        if (!ignore) {
          if (isOnRamp) {
            setLoadingPayTokens(false);
          } else {
            setLoadingReceiveTokens(false);
          }
        }
      }
    };

    if (isOnRamp || selectedCryptoPayToken) {
      loadOptions();
    }

    return () => {
      ignore = true;
    };
  }, [isOnRamp, selectedCryptoPayToken, selectedCryptoReceiveToken]);

  useEffect(() => {
    let ignore = false;

    const fetchQuote = async () => {
      if (!payAmount || Number.parseFloat(payAmount) <= 0 || !payToken || !receiveToken || !countryCode) {
        setReceiveAmount('');
        setBestPartner(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getAvailablePartners({
          countryCode,
          rampType: rampMode,
          fromCurrency: isOnRamp ? payToken.code : selectedCryptoPayToken.code,
          toCurrency: isOnRamp ? selectedCryptoReceiveToken.code : receiveToken.code,
          paymentMethod: isOnRamp ? payToken.paymentMethod : receiveToken.paymentMethod,
          fromAmount: payAmount,
          partnerTypes: ['REDIRECT'],
        });

        if (ignore) {
          return;
        }

        const sortedPartners = (result.partners || []).sort(
          (a, b) => Number.parseFloat(b.toAmount || 0) - Number.parseFloat(a.toAmount || 0),
        );

        if (sortedPartners.length === 0) {
          setBestPartner(null);
          setReceiveAmount('');
          return;
        }

        const best = sortedPartners[0];
        const outputToken = isOnRamp ? selectedCryptoReceiveToken : receiveToken;

        setBestPartner(best);
        setReceiveAmount(formatTokenAmount(best.toAmount, outputToken));
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setBestPartner(null);
          setReceiveAmount('');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchQuote, 350);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    countryCode,
    isOnRamp,
    payAmount,
    payToken,
    rampMode,
    receiveToken,
    selectedCryptoPayToken,
    selectedCryptoReceiveToken,
  ]);

  const handleCreateOrder = async (partner) => {
    setLoading(true);

    try {
      const result = await createRedirectOrder({
        countryCode,
        rampType: rampMode,
        fromCurrency: isOnRamp ? payToken.code : selectedCryptoPayToken.code,
        toCurrency: isOnRamp ? selectedCryptoReceiveToken.code : receiveToken.code,
        paymentMethod: isOnRamp ? payToken.paymentMethod : receiveToken.paymentMethod,
        fromAmount: payAmount,
        partnerId: partner.partnerId,
      });

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!bestPartner || !payAmount || Number.parseFloat(payAmount) <= 0) {
      return;
    }

    await handleCreateOrder(bestPartner);
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (!payAmount) return 'Enter amount';
    if (bestPartner) {
      return isOnRamp ? `Buy via ${bestPartner.partnerName}` : `Withdraw via ${bestPartner.partnerName}`;
    }
    return isOnRamp ? 'Get buy quote' : 'Get payout quote';
  };

  const payHelperText = isOnRamp
    ? formatFiatValue(payAmount, payToken?.code || detectedCurrency || 'EUR')
    : payAmount
      ? `$${(Number.parseFloat(payAmount) * (selectedCryptoPayToken.code === 'SOLANA_SOL' ? 150 : 1)).toFixed(2)}`
      : '$0.00';

  const receiveHelperText = isOnRamp
    ? `${receiveAmount || '0'} ${selectedCryptoReceiveToken.name}`
    : formatFiatValue(receiveAmount, receiveToken?.code || detectedCurrency || 'EUR');

  const payAssetTypeLabel = isOnRamp ? 'Fiat' : 'Crypto';
  const receiveAssetTypeLabel = isOnRamp ? 'Crypto' : 'Fiat';

  return (
    <div className="mx-auto w-full max-w-xl">
      <TokenSelectorModal
        isOpen={activeSelector !== null}
        title={selectorTitle}
        tokens={selectorTokens}
        selected={selectorSelected}
        loading={selectorLoading}
        onClose={() => setActiveSelector(null)}
        onSelect={handleSelectToken}
      />

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
          {modeLabel}
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
            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-300">{payAssetTypeLabel}</div>
              <div className="mt-1 text-sm font-medium text-slate-400">You pay</div>
            </div>
            {isOnRamp ? (
              <TokenSelectorButton
                selected={payToken}
                loading={loadingPayTokens}
                onClick={() => setActiveSelector('pay')}
              />
            ) : (
              <TokenSelectorButton
                selected={selectedCryptoPayToken}
                loading={false}
                onClick={() => setActiveSelector('pay')}
              />
            )}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <input
                type="number"
                value={payAmount}
                onChange={(event) => setPayAmount(event.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-5xl font-semibold tracking-[-0.05em] text-white outline-none placeholder:text-slate-600"
              />
              <div className="mt-3 text-sm text-slate-500">{payHelperText}</div>
            </div>

            <div className="hidden rounded-2xl border border-white/6 bg-[#0e1c2c] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
              {isOnRamp ? 'Fund instantly' : 'Available instantly'}
            </div>
          </div>
        </div>

        <div className="relative z-10 -my-3 flex justify-center">
          <button
            type="button"
            onClick={toggleRampMode}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#13253b] shadow-[0_16px_32px_rgba(3,10,20,0.45)] transition hover:border-cyan-400/35 hover:bg-[#17304c]"
            title={`Switch to ${isOnRamp ? 'off-ramp' : 'on-ramp'}`}
            aria-label={`Switch to ${isOnRamp ? 'off-ramp' : 'on-ramp'}`}
          >
            <svg className="h-6 w-6 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3-3m-3 3 3 3" />
            </svg>
          </button>
        </div>

        <div className="rounded-[1.75rem] border border-white/6 bg-[#101f31] p-5 shadow-[inset_0_1px_0_rgba(191,233,255,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-300">{receiveAssetTypeLabel}</div>
              <div className="mt-1 text-sm font-medium text-slate-400">You receive</div>
            </div>
            {isOnRamp ? (
              <TokenSelectorButton
                selected={selectedCryptoReceiveToken}
                loading={false}
                onClick={() => setActiveSelector('receive')}
              />
            ) : (
              <TokenSelectorButton
                selected={receiveToken}
                loading={loadingReceiveTokens}
                onClick={() => setActiveSelector('receive')}
              />
            )}
          </div>

          <div className="flex items-end gap-3">
            <div className={`text-5xl font-semibold tracking-[-0.05em] ${receiveAmount ? 'text-white' : 'text-slate-600'}`}>
              {loading ? <span className="animate-pulse">...</span> : receiveAmount || '0'}
            </div>
            {bestPartner && (
              <div className="mb-2 flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
                <img src={bestPartner.icon} alt={bestPartner.partnerName} className="h-5 w-5 rounded" title={`Best rate: ${bestPartner.partnerName}`} />
                <span>{bestPartner.partnerName}</span>
              </div>
            )}
          </div>

          <div className="mt-3 text-sm text-slate-500">{receiveHelperText}</div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-2xl border border-white/6 bg-[#0b1624] px-4 py-3 text-sm text-slate-400">
            {bestPartner && payAmount
              ? `${isOnRamp ? 'Best buy route' : 'Best payout route'} via ${bestPartner.partnerName}`
              : `Enter an amount to fetch the best ${isOnRamp ? 'on-ramp' : 'off-ramp'} quote.`}
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#0b1624] px-4 py-3 text-sm text-slate-400">
            Redirect checkout after quote confirmation.
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={loading || !payAmount || !bestPartner}
          className="mt-4 w-full rounded-[1.4rem] bg-[linear-gradient(180deg,#396690_0%,#274c72_100%)] py-4 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(21,59,97,0.42)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
