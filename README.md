# عِدّة (Edda) - Maintenance Services & Hardware Marketplace

> **منصة صيانة مضمونة ومتجر قطع غيار موثوق**  
> Scalable, production-ready marketplace monorepo for home & facility maintenance services, verified technicians, and partner hardware stores.

---

## Workspace Structure

```
edda-prototype/
├── apps/
│   ├── api/            # NestJS REST API, Prisma ORM, WebSocket Gateways, Swagger
│   ├── dashboard/      # Next.js 14+, TypeScript, Tailwind CSS, Arabic RTL Default
│   └── mobile/         # Flutter application for Customers and Technicians (Riverpod, GoRouter)
├── packages/
│   ├── shared-types/   # Domain interfaces, enums, DTOs, minor-unit money types
│   ├── shared-config/  # Shared TypeScript, Prettier, and ESLint configurations
│   └── documentation/  # Architecture, SafePay, Anti-circumvention, and API specifications
├── docker-compose.yml  # Local PostgreSQL 16 & Redis orchestration
├── index.html          # Original UI/UX prototype (preserved untouched for reference)
├── package.json        # Monorepo root with npm workspaces
└── README.md
```

## Production Stack
- **Backend**: Node.js, NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, Swagger/OpenAPI.
- **Web Dashboard**: Next.js App Router, TypeScript, Tailwind CSS, Cairo Arabic typography.
- **Mobile App**: Flutter, Dart, Riverpod state management, GoRouter navigation, Dio HTTP client, Flutter Secure Storage.
- **Security**: Helmet, strict CORS, Throttler rate limiting, bcrypt password hashing, phone OTP authentication, JWT access/refresh rotation, audit logs.
- **Payments**: Provider-agnostic `PaymentGateway` architecture (EGP integer minor units, idempotency keys, webhook persistence, no fake escrow).

## Quick Start
Refer to [SETUP_GUIDE.md](packages/documentation/SETUP_GUIDE.md) for full setup instructions.