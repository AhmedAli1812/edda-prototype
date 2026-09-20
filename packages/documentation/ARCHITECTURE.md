# Edda (عِدّة) System Architecture

## Overview
Edda is a production-grade maintenance services marketplace connecting Egyptian households with verified technicians and local partner hardware/parts stores.

## Monorepo Layout
- **`apps/api/`**: NestJS REST API + WebSocket gateways, Prisma ORM, PostgreSQL, Redis.
- **`apps/dashboard/`**: Next.js (App Router), TypeScript, Tailwind CSS with full Arabic RTL support for Admins and Partner Stores.
- **`apps/mobile/`**: Flutter cross-platform mobile application for Customers and Technicians (Riverpod, GoRouter, Dio, SecureStorage).
- **`packages/shared-types/`**: Shared domain enums, model interfaces, and DTO contracts.
- **`packages/shared-config/`**: Shared TypeScript, ESLint, and Prettier configurations.
- **`packages/documentation/`**: Technical specs, domain rules, and developer manuals.

## Core Architectural Decisions
1. **Integer Minor Units**: All monetary calculations and storage use integer minor units (Egyptian Piasters, where 100 Piasters = 1.00 EGP) to eliminate floating-point rounding errors.
2. **Provider-Agnostic PaymentGateway**: The platform interacts with payments solely through an abstraction layer. It does NOT claim to hold escrow directly; it triggers authorization, capture, void, refund, and webhook verification via licensed payment aggregators.
3. **Anti-Circumvention Protection**: Customers' full addresses and direct phone numbers remain hidden until payment authorization is confirmed. In-app chat filters intercept communication violations.
4. **Clean Architecture**: Domain business logic is decoupled from infrastructure frameworks, ensuring high testability and maintainability.
