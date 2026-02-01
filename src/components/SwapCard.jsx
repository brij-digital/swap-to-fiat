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
  PAYMENT_METHOD: 'payment_method',
  PARTNERS: 'partners',
  CONFIRM: 'confirm',
};

export default function SwapCard() {
  const [step, setStep] = useState(STEPS.INPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [fromCurrency, setFromCurrency] = useState(CRYPTO_CURRENCIES[0]);
  const [toCurrency, setToCurrency] = useState(FIAT_CURRENCIES[0]);
  const [amount, setAmount] = useState('50');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [isFiatMode, setIsFiatMode] = useState(true);
  
  // API results
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Fetch payment methods when switching to fiat mode
  const handleGetPaymentMethods = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSupportedPaymentMethods({
        countryCode: country.code,
        rampType: 'OFFRAMP',
        fromCurrency: fromCurrency.code,
        toCurrency: toCurrency.code,
      });
      
      setPaymentMethods(result.paymentMethods || []);
      setStep(STEPS.PAYMENT_METHOD);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch partners for selected payment method
  const handleGetPartners = async (method) => {
    setSelectedPaymentMethod(method);
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAvailablePartners({
        countryCode: country.code,
        rampType: 'OFFRAMP',
        fromCurrency: fromCurrency.code,
        toCurrency: toCurrency.code,
        paymentMethod: method.code,
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
        toCurrency: toCurrency.code,
        paymentMethod: selectedPaymentMethod.code,
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
    if (step === STEPS.PAYMENT_METHOD) setStep(STEPS.INPUT);
    if (step === STEPS.PARTNERS) setStep(STEPS.PAYMENT_METHOD);
    if (step === STEPS.CONFIRM) setStep(STEPS.PARTNERS);
  };

  const validateAmount = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }
    setError(null);
    return true;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {step === STEPS.INPUT && 'Swap to Fiat'}
            {step === STEPS.PAYMENT_METHOD && 'Select Payment'}
            {step === STEPS.PARTNERS && 'Select Provider'}
            {step === STEPS.CONFIRM && 'Confirm'}
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

            {/* To (Fiat) */}
            <div className="bg-[#0d1117] rounded-xl p-4">
              <label className="text-sm text-gray-400 mb-2 block">You receive (Fiat)</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-2xl font-semibold text-gray-500">
                  ≈ Quote on next step
                </div>
                <select
                  value={toCurrency.code}
                  onChange={(e) => setToCurrency(FIAT_CURRENCIES.find(c => c.code === e.target.value))}
                  className="bg-[#30363d] rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  {FIAT_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.icon} {c.code}</option>
                  ))}
                </select>
              </div>
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
            <button
              onClick={() => validateAmount() && handleGetPaymentMethods()}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 rounded-xl py-4 font-semibold transition"
            >
              {loading ? 'Loading...' : 'Continue to Payment Method'}
            </button>

            {/* Powered by */}
            <p className="text-center text-xs text-gray-500">
              Powered by <span className="text-violet-400">Brij.fi</span>
            </p>
          </div>
        )}

        {/* Step: Payment Methods */}
        {step === STEPS.PAYMENT_METHOD && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              Converting {amount} {fromCurrency.name} to {toCurrency.code}
            </p>
            
            {paymentMethods.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payment methods available</p>
            ) : (
              paymentMethods.map((method) => (
                <button
                  key={method.code}
                  onClick={() => handleGetPartners(method)}
                  disabled={loading}
                  className="w-full bg-[#0d1117] hover:bg-[#1c2128] border border-[#30363d] rounded-xl p-4 flex items-center gap-4 transition text-left"
                >
                  <img src={method.icon} alt={method.name} className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <div className="font-semibold">{method.name}</div>
                    <div className="text-sm text-gray-400">
                      Min: {parseFloat(method.aggregatedLimit?.min || 0).toFixed(2)} {fromCurrency.name}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step: Partners */}
        {step === STEPS.PARTNERS && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              {amount} {fromCurrency.name} via {selectedPaymentMethod?.name}
            </p>
            
            {partners.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No providers available</p>
            ) : (
              partners.map((partner) => (
                <button
                  key={partner.partnerId}
                  onClick={() => handleCreateOrder(partner)}
                  disabled={loading}
                  className="w-full bg-[#0d1117] hover:bg-[#1c2128] border border-[#30363d] rounded-xl p-4 flex items-center gap-4 transition text-left"
                >
                  <img src={partner.icon} alt={partner.name} className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <div className="font-semibold">{partner.name}</div>
                    <div className="text-sm text-green-400">
                      You get: {parseFloat(partner.toAmount || 0).toFixed(2)} {toCurrency.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rate: 1 {fromCurrency.name} = {parseFloat(partner.rate || 0).toFixed(4)} {toCurrency.code}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
