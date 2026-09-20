# SafePay Lifecycle & State Machine

## Principles
1. **No Fake Escrow**: Edda is not a bank and does not directly hold customer deposits. Payment authorizations and captures are routed through licensed Central Bank of Egypt-compliant payment service providers.
2. **Deterministic Stages**:
   - `OFFER_ACCEPTED`: Customer selects technician offer. Payment intent created with unique `idempotencyKey`.
   - `AUTHORIZED`: Customer completes 3DS/card verification. Funds are reserved with the payment provider. Full address and proxy communication are now unlocked.
   - `ARRIVAL_OTP`: Technician arrives at customer location and inputs the 4-digit Arrival OTP displayed on the customer's phone to verify physical presence.
   - `CHANGE_ORDERS`: If unexpected parts or labor are needed, technician raises a change order in the app. Customer must explicitly approve and pay via SafePay before work proceeds.
   - `COMPLETION_OTP`: Customer enters the 4-digit Completion OTP once satisfied with service completion.
   - `DISPUTE_WINDOW`: A 24-hour dispute window opens upon completion.
   - `SETTLEMENT`: If no dispute is filed within 24 hours, platform commission is deducted (e.g., 12%) and technician net payout is credited to their wallet balance.

```
[Customer Selects Offer] 
        │
        ▼
[Payment Authorization (SafePay)]
        │
        ├─► [Address & Masked Contact Revealed]
        │
        ▼
[Technician Arrives -> Enters Arrival OTP]
        │
        ├─► [Change Order Needed? -> Customer Approves & Pays Additional Minor Units]
        │
        ▼
[Work Completed -> Customer Provides Completion OTP]
        │
        ▼
[24-Hour Dispute Window Initiated]
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[Dispute Raised]          [No Dispute (24h Expired)]
   │                             │
[Admin Arbitration]       [Commission Deducted & Balance Released]
```
