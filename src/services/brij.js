const API_BASE = 'https://api.brij.fi';
const API_KEY = '5h5pE5heGiGJtmonvySBTnHTSSdyqpv8awphhGaa1axt';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export async function getSupportedPaymentMethods({ countryCode, rampType, fromCurrency, toCurrency }) {
  const body = { rampType, fromCurrency, toCurrency };
  if (countryCode) body.countryCode = countryCode;
  
  const response = await fetch(`${API_BASE}/brij.core.v1.customer.Service/GetSupportedPaymentMethods`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

export async function getAvailablePartners({ countryCode, rampType, fromCurrency, toCurrency, paymentMethod, fromAmount, partnerTypes }) {
  const response = await fetch(`${API_BASE}/brij.core.v1.customer.Service/GetAvailablePartners`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ countryCode, rampType, fromCurrency, toCurrency, paymentMethod, fromAmount, partnerTypes }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

export async function createRedirectOrder({ countryCode, rampType, fromCurrency, toCurrency, paymentMethod, fromAmount, partnerId }) {
  const response = await fetch(`${API_BASE}/brij.core.v1.customer.Service/CreateRedirectOrder`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ countryCode, rampType, fromCurrency, toCurrency, paymentMethod, fromAmount, partnerId }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Supported currencies for demo
export const CRYPTO_CURRENCIES = [
  { code: 'SOLANA_USDC', name: 'USDC', icon: '💵', network: 'Solana' },
  { code: 'SOLANA_SOL', name: 'SOL', icon: '◎', network: 'Solana' },
];

export const FIAT_CURRENCIES = [
  { code: 'EUR', name: 'Euro', icon: '🇪🇺' },
  { code: 'USD', name: 'US Dollar', icon: '🇺🇸' },
  { code: 'CZK', name: 'Czech Koruna', icon: '🇨🇿' },
  { code: 'GBP', name: 'British Pound', icon: '🇬🇧' },
];

export const COUNTRIES = [
  { code: 'CZE', name: 'Czech Republic' },
  { code: 'DEU', name: 'Germany' },
  { code: 'FRA', name: 'France' },
  { code: 'ESP', name: 'Spain' },
  { code: 'USA', name: 'United States' },
  { code: 'GBR', name: 'United Kingdom' },
];
