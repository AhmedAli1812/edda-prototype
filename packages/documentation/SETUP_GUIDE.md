# Edda Local Development Setup Guide

## Prerequisites
- Node.js >= 20 (Detected: v24.11.1)
- npm >= 10 (Detected: 11.6.2)
- Flutter >= 3.20 (Detected: 3.38.9) with Dart (Detected: 3.10.8)
- MySQL 8.0 (via Docker Compose or local MySQL service)

## Step-by-Step Setup

### 1. Configure Environment
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

### 2. Database Setup
Option A (Docker Desktop):
```bash
npm run docker:up
```

Option B (Local MySQL 8):
Ensure MySQL 8.0 is running on port 3306 with credentials matching `apps/api/.env`.

### 3. Generate Prisma Client and Seed
```bash
cd apps/api
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 4. Run NestJS API
```bash
cd apps/api
npm run start:dev
# API runs on http://localhost:4000
# Swagger API docs available at http://localhost:4000/api/docs
```

### 5. Run Next.js Dashboard
```bash
cd apps/dashboard
npm install
npm run dev
# Dashboard runs on http://localhost:3000
```

### 6. Run Flutter Mobile App
```bash
cd apps/mobile
flutter pub get
flutter run
```
