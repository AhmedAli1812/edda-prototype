# Anti-Circumvention Policy & Engine Specification

## The Reality of Service Marketplaces
No platform can mathematically prevent 100% of off-platform dealings without degrading user privacy and experience. Edda aligns incentives so that staying on-platform is overwhelmingly advantageous, while actively discouraging and auditing circumvention attempts.

## Core Defenses
1. **Masked Geolocation & Contact**:
   - Before payment authorization, technicians only see approximate distance, neighborhood/district (e.g. "مدينة نصر - المنطقة الأولى"), and problem photos.
   - Street name, building number, and apartment are withheld.
   - Direct phone numbers are never exchanged; calls are mediated through virtual proxy numbers or in-app VoIP.
2. **Realtime Chat Moderation**:
   - Outbound chat messages are scanned by a regex & NLP filter for Egyptian phone number patterns (`010...`, `011...`, `012...`, `015...`, written digits in Arabic/English), external payment handles (InstaPay, Vodafone Cash numbers), and suspicious bypass keywords.
   - Flagged attempts are logged in `ChatAntiCircumventionLog` with risk scores (`LOW`, `MEDIUM`, `HIGH`). Repeated offenders are flagged in the Admin Risk Center for suspension.
3. **Incentive Alignment**:
   - 30-day work warranty, official tax invoices, reward points, and dispute arbitration only protect services transacted through SafePay.
