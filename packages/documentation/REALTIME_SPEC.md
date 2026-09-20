# Real-time WebSocket Architecture

## Overview
Edda prepares a unified NestJS WebSocket Gateway subsystem using Socket.io or ws adapter.

### Scaffolded Gateways
1. **`ChatGateway` (`/chat`)**:
   - Room per `ChatConversation`.
   - Incoming messages trigger the Anti-Circumvention interceptor before broadcast.
2. **`JobTrackingGateway` (`/jobs`)**:
   - Live status transitions (`EN_ROUTE`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`).
   - OTP confirmation events.
3. **`TechnicianLocationGateway` (`/tracking`)**:
   - Live technician GPS coordinates dispatched to the assigned customer when job is `EN_ROUTE`.
4. **`OffersGateway` (`/offers`)**:
   - Pushes new incoming bids to the customer request room in real time.
5. **`StoreOrdersGateway` (`/orders`)**:
   - Live order alerts for partner stores (New orders, pickup ready notifications).
