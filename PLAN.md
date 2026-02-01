# Swap-to-Fiat Frontend - Plan de Développement

## Objectif
Créer un frontend de démonstration montrant comment intégrer une option de swap crypto → fiat (off-ramp) dans une interface de swap Solana, en utilisant l'API Brij.fi.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│  1. Token Selector (FROM: SOL/USDC)                     │
│  2. Destination Selector:                                │
│     - Crypto token (swap classique)                     │
│     - ⭐ FIAT (EUR/USD/CZK via Brij)                    │
│  3. Amount Input                                         │
│  4. Payment Method Selector (SEPA, Card, etc.)          │
│  5. Partner Selection (auto ou manuel)                  │
│  6. Order Creation → Redirect vers partner              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API Brij.fi (Demo)                      │
├─────────────────────────────────────────────────────────┤
│  • GetSupportedPaymentMethods                           │
│  • GetAvailablePartners                                 │
│  • CreateRedirectOrder                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Technique

- **Framework**: React + Vite (rapide, moderne)
- **Styling**: Tailwind CSS (dark theme, style swap)
- **HTTP Client**: fetch natif
- **Wallet**: @solana/wallet-adapter (optionnel pour v1)
- **Déploiement**: GitHub Pages ou Vercel

---

## Phases de Développement

### Phase 1: Setup & Structure (30 min)
- [ ] Init projet Vite + React + Tailwind
- [ ] Structure des dossiers
- [ ] Composants de base (Layout, Card)

### Phase 2: UI du Swap (1h)
- [ ] Token selector (FROM)
- [ ] Destination selector avec option "Fiat"
- [ ] Input montant
- [ ] Bouton "Get Quote" / "Swap"

### Phase 3: Intégration API Brij (1h30)
- [ ] Service API avec les 3 endpoints
- [ ] GetSupportedPaymentMethods → afficher les méthodes
- [ ] GetAvailablePartners → afficher les partners + rates
- [ ] CreateRedirectOrder → obtenir redirect URL

### Phase 4: Flow Complet (1h)
- [ ] État global du flow (steps)
- [ ] Affichage du rate/quote
- [ ] Confirmation et redirect
- [ ] Gestion erreurs

### Phase 5: Polish & Deploy (30 min)
- [ ] Responsive design
- [ ] Loading states
- [ ] Deploy sur GitHub Pages

---

## Critères de Succès (Vérifiables)

### ✅ CS1: API Connection
**Test**: Appeler `GetSupportedPaymentMethods` avec:
```json
{
  "countryCode": "CZE",
  "rampType": "OFFRAMP", 
  "fromCurrency": "SOLANA_USDC",
  "toCurrency": "EUR"
}
```
**Succès**: Réponse 200 avec liste de payment methods

### ✅ CS2: Partners Loading
**Test**: Appeler `GetAvailablePartners` avec payment method sélectionné
**Succès**: Réponse 200 avec au moins 1 partner + rate affiché

### ✅ CS3: Order Creation
**Test**: Appeler `CreateRedirectOrder` avec données valides
**Succès**: Réponse 200 avec `redirectUrl` non vide

### ✅ CS4: UI Flow
**Test**: Parcours utilisateur complet
1. Sélectionner USDC comme source
2. Sélectionner EUR (Fiat) comme destination
3. Entrer montant "50"
4. Voir les payment methods disponibles
5. Sélectionner SEPA
6. Voir les partners avec rates
7. Cliquer "Swap to Fiat"
8. Être redirigé vers partner

**Succès**: Toutes les étapes fonctionnent sans erreur console

### ✅ CS5: Error Handling
**Test**: Entrer un montant invalide (0 ou négatif)
**Succès**: Message d'erreur affiché, pas de crash

### ✅ CS6: Responsive
**Test**: Ouvrir sur mobile (375px width)
**Succès**: UI utilisable, pas de scroll horizontal

---

## Endpoints API Brij (Référence)

### 1. GetSupportedPaymentMethods
```bash
curl -X POST https://api-demo.brij.fi/brij.core.v1.customer.Service/GetSupportedPaymentMethods \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "CZE",
    "rampType": "OFFRAMP",
    "fromCurrency": "SOLANA_USDC",
    "toCurrency": "EUR"
  }'
```

### 2. GetAvailablePartners
```bash
curl -X POST https://api-demo.brij.fi/brij.core.v1.customer.Service/GetAvailablePartners \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "CZE",
    "rampType": "OFFRAMP",
    "fromCurrency": "SOLANA_USDC",
    "toCurrency": "EUR",
    "paymentMethod": "EUR_SEPA",
    "fromAmount": "50",
    "partnerTypes": ["REDIRECT"]
  }'
```

### 3. CreateRedirectOrder
```bash
curl -X POST https://api-demo.brij.fi/brij.core.v1.customer.Service/CreateRedirectOrder \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "CZE",
    "rampType": "OFFRAMP",
    "fromCurrency": "SOLANA_USDC",
    "toCurrency": "EUR",
    "paymentMethod": "EUR_SEPA",
    "fromAmount": "50",
    "partnerId": "guardarian"
  }'
```

---

## Timeline Estimée

| Phase | Durée | Cumulé |
|-------|-------|--------|
| Setup | 30min | 30min |
| UI Swap | 1h | 1h30 |
| API Integration | 1h30 | 3h |
| Flow Complet | 1h | 4h |
| Polish & Deploy | 30min | 4h30 |

**Total: ~4-5 heures de développement**

---

## Prochaine Étape

Valider ce plan puis commencer Phase 1 (Setup).
