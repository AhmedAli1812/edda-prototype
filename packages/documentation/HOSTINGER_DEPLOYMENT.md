# Hostinger Node.js Deployment Guide (Edda API)

This guide documents deploying the **Edda NestJS REST API** on Hostinger using the **Node.js Web App** feature (hPanel) connected to a **Hostinger MySQL Database**.

---

## 1. Prerequisites in Hostinger hPanel

1. **Hostinger Plan**: Business Web Hosting, Cloud Hosting, or VPS supporting Node.js Web Apps.
2. **Node.js Version**: Select **Node.js 20.x** (or Node 22.x LTS) in hPanel.
3. **Create MySQL Database in hPanel**:
   - Go to **Databases** -> **Management**.
   - Create a new MySQL database:
     - Database Name: `u123456789_edda`
     - Database Username: `u123456789_edda_usr`
     - Password: Set a strong, unique password.
   - Note the **Host** (usually `localhost` or `127.0.0.1` on Hostinger shared hosting).

---

## 2. Environment Variables Configuration (hPanel)

In your Hostinger Node.js Web App settings, add the following environment variables (do NOT commit these to Git):

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode & optimizations |
| `PORT` | *(Leave unset or 3000/4000)* | Hostinger dynamically maps `process.env.PORT` |
| `API_PREFIX` | `api/v1` | Global API route prefix |
| `DATABASE_URL` | `mysql://USER:PASSWORD@127.0.0.1:3306/DB_NAME?sslaccept=strict` | MySQL connection string with SSL |
| `REDIS_ENABLED` | `false` | Redis is optional; API runs in-memory without it |
| `JWT_ACCESS_SECRET` | *(64+ random hex characters)* | Secret for signing access tokens |
| `JWT_REFRESH_SECRET`| *(64+ random hex characters)* | Secret for signing refresh tokens |
| `CORS_ALLOWED_ORIGINS` | `https://admin.yourdomain.com,https://yourdomain.com` | Whitelisted frontend origins |
| `STORAGE_DRIVER` | `local` (or `s3` for AWS/Wasabi) | Local stores in `./uploads` on persistent disk |
| `STORAGE_LOCAL_ROOT` | `./uploads` | Persistent directory for user photos |
| `PAYMENT_GATEWAY_PROVIDER` | `mock` (switch to licensed Egyptian gateway) | Provider-agnostic payment gateway |

> [!NOTE]
> **MySQL SSL Support**: When connecting locally on the same Hostinger server, `127.0.0.1:3306` does not require SSL certificates. If connecting from an external host or if SSL is enforced on your database, append `?sslaccept=strict` to the `DATABASE_URL`.

---

## 3. Hostinger Application Settings

In **hPanel -> Node.js Web App**:

- **Application Root**: `/home/u123456789/domains/api.yourdomain.com/public_html` (or `apps/api`)
- **Application Startup File**: `dist/main.js`
- **Application Mode**: `Production`

---

## 4. Build & Deployment Commands

### Via SSH / Deployment Script:
```bash
# 1. Install production dependencies
npm install --omit=dev

# 2. Generate Prisma Client for MySQL
npx prisma generate

# 3. Apply schema migrations safely to Hostinger MySQL
npx prisma db push

# 4. Build the NestJS API
npm run build

# 5. Restart application via hPanel or PM2
# In hPanel: Click 'Restart' on the Node.js Web App card
```

### Initial Database Seeding (Run once):
```bash
# Optional: Seed initial categories, products, and admin accounts
npm run prisma:seed
```

---

## 5. Security & Verification Checklist

- [ ] `process.env.PORT` is dynamically respected by NestJS `main.ts`.
- [ ] Swagger documentation is restricted or protected in production.
- [ ] Storage uploads directory `./uploads` has write permissions (`chmod 755`).
- [ ] No real database credentials or API keys are committed to Git.
- [ ] Production CORS strictly whitelists only your domain names.
