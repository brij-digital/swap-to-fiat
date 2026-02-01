import { useState, useEffect } from 'react';
import { 
  getSupportedPaymentMethods, 
  getAvailablePartners, 
  createRedirectOrder,
  CRYPTO_CURRENCIES,
  FIAT_CURRENCIES,
  COUNTRIES
} from '../services/brij';

const STEPS = {
  INPUT: 'input',
  PARTNERS: 'partners',
};

export default function SwapCard() {
  const [step, setStep] = useState(STEPS.INPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [fromCurrency, setFromCurrency] = useState(CRYPTO_CURRENCIES[0]);
  const [amount, setAmount] = useState('50');
  const [country, setCountry] = useState(COUNTRIES[0]);
  
  // Destination mode: 'crypto' or 'fiat'
  const [destMode, setDestMode] = useState('fiat');
  
  // For crypto mode
  const [toCrypto, setToCrypto] = useState(CRYPTO_CURRENCIES[1]);
  
  // For fiat mode - combined fiat + payment method options
  const [fiatOptions, setFiatOptions] = useState([]);
  const [selectedFiatOption, setSelectedFiatOption] = useState(null);
  const [loadingFiatOptions, setLoadingFiatOptions] = useState(false);
  
  // Partners
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Fetch fiat options when mode changes to fiat or country/fromCurrency changes
  useEffect(() => {
    if (destMode === 'fiat') {
      fetchAllFiatOptions();
    }
  }, [destMode, country, fromCurrency]);

  // Fetch all fiat currencies with their payment methods
  const fetchAllFiatOptions = async () => {
    setLoadingFiatOptions(true);
    setError(null);
    
    const allOptions = [];
    
    try {
      // Fetch payment methods for each fiat currency
      for (const fiat of FIAT_CURRENCIES) {
        try {
          const result = await getSupportedPaymentMethods({
            countryCode: country.code,
            rampType: 'OFFRAMP',
            fromCurrency: fromCurrency.code,
            toCurrency: fiat.code,
          });
          
          if (result.paymentMethods && result.paymentMethods.length > 0) {
            for (const method of result.paymentMethods) {
              allOptions.push({
                id: `${fiat.code}_${method.code}`,
                fiat: fiat,
                paymentMethod: method,
                label: `${fiat.icon} ${fiat.code} via ${method.name}`,
                icon: method.icon,
                min: parseFloat(method.aggregatedLimit?.min || 0),
                max: parseFloat(method.aggregatedLimit?.max || 0),
              });
            }
          }
        } catch (err) {
          // Skip this fiat if not supported
          console.log(`${fiat.code} not supported for this config`);
        }
      }
      
      setFiatOptions(allOptions);
      if (allOptions.length > 0 && !selectedFiatOption) {
        setSelectedFiatOption(allOptions[0]);
      }
    } catch (err) {
      setError('Failed to load fiat options');
    } finally {
      setLoadingFiatOptions(false);
    }
  };

  // Fetch partners for selected fiat option
  const handleGetPartners = async () => {
    if (!selectedFiatOption) return;
    
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAvailablePartners({
        countryCode: country.code,
        rampType: 'OFFRAMP',
        fromCurrency: fromCurrency.code,
        toCurrency: selectedFiatOption.fiat.code,
        paymentMethod: selectedFiatOption.paymentMethod.code,
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
    setSelectedPartner(partner);
    setLoading(true);
    setError(null);
    
    try {
      const result = await createRedirectOrder({
        countryCode: country.code,
        rampType: 'OFFRAMP',
        fromCurrency: fromCurrency.code,
        toCurrency: selectedFiatOption.fiat.code,
        paymentMethod: selectedFiatOption.paymentMethod.code,
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
            {/* From (Crypto) */}
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
                <select
                  value={fromCurrency.code}
                  onChange={(e) => setFromCurrency(CRYPTO_CURRENCIES.find(c => c.code === e.target.value))}
                  className="bg-[#30363d] rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  {CRYPTO_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.icon} {c.name}</option>
                  ))}
                </select>
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

            {/* To - Mode Selector */}
            <div className="bg-[#0d1117] rounded-xl p-4">
              <label className="text-sm text-gray-400 mb-2 block">You receive</label>
              
              {/* Crypto / Fiat Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setDestMode('crypto')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    destMode === 'crypto' 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-[#30363d] text-gray-400 hover:text-white'
                  }`}
                >
                  🪙 Crypto
                </button>
                <button
                  onClick={() => setDestMode('fiat')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    destMode === 'fiat' 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-[#30363d] text-gray-400 hover:text-white'
                  }`}
                >
                  💵 Fiat
                </button>
              </div>

              {/* Crypto Mode */}
              {destMode === 'crypto' && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-2xl font-semibold text-gray-500">
                    Coming soon...
                  </div>
                  <select
                    value={toCrypto.code}
                    onChange={(e) => setToCrypto(CRYPTO_CURRENCIES.find(c => c.code === e.target.value))}
                    className="bg-[#30363d] rounded-lg px-3 py-2 outline-none cursor-pointer"
                    disabled
                  >
                    {CRYPTO_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fiat Mode - Combined Currency + Payment Method */}
              {destMode === 'fiat' && (
                <div>
                  {loadingFiatOptions ? (
                    <div className="text-center py-4 text-gray-400">
                      <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                      Loading options...
                    </div>
                  ) : fiatOptions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No fiat options available for this configuration
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {fiatOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedFiatOption(option)}
                          className={`w-full p-3 rounded-lg flex items-center gap-3 transition text-left ${
                            selectedFiatOption?.id === option.id
                              ? 'bg-violet-600/20 border border-violet-500'
                              : 'bg-[#1c2128] hover:bg-[#262c36] border border-transparent'
                          }`}
                        >
                          <img src={option.icon} alt="" className="w-8 h-8 rounded" />
                          <div className="flex-1">
                            <div className="font-medium">{option.fiat.icon} {option.fiat.code}</div>
                            <div className="text-xs text-gray-400">{option.paymentMethod.name}</div>
                          </div>
                          {selectedFiatOption?.id === option.id && (
                            <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Your country</label>
              <select
                value={country.code}
                onChange={(e) => setCountry(COUNTRIES.find(c => c.code === e.target.value))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 outline-none"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* CTA */}
            {destMode === 'fiat' && (
              <button
                onClick={handleGetPartners}
                disabled={loading || !selectedFiatOption || loadingFiatOptions}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 rounded-xl py-4 font-semibold transition"
              >
                {loading ? 'Loading...' : `Swap to ${selectedFiatOption?.fiat.code || 'Fiat'}`}
              </button>
            )}

            {destMode === 'crypto' && (
              <button
                disabled
                className="w-full bg-gray-600 opacity-50 rounded-xl py-4 font-semibold cursor-not-allowed"
              >
                Crypto swap coming soon
              </button>
            )}

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
                Converting <span className="text-white font-medium">{amount} {fromCurrency.name}</span>
              </p>
              <p className="text-sm text-gray-400">
                To <span className="text-white font-medium">{selectedFiatOption?.fiat.code}</span> via {selectedFiatOption?.paymentMethod.name}
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
                      {parseFloat(partner.toAmount || 0).toFixed(2)} {selectedFiatOption?.fiat.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rate: 1 {fromCurrency.name} = {parseFloat(partner.rate || 0).toFixed(4)} {selectedFiatOption?.fiat.code}
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
