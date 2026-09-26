# 🚀 ELAP Full-Stack Deployment Guide for Vercel

This guide provides the complete, production-ready configuration and environment variable reference to deploy the **ELAP (Employee Leave Management & Approval Portal)** monorepo to Vercel without errors.

---

## 📌 Architecture & Vercel Strategy

ELAP is structured as a full-stack monorepo:
- **Frontend**: Vite + React 18 + Tailwind CSS SPA (`frontend/dist`)
- **Backend API**: Express + TypeScript + Prisma ORM + Socket.IO Serverless Function (`api/index.js` -> `backend/dist`)
- **Database**: Supabase PostgreSQL with transaction connection pooler (port `6543`)
- **Authentication**: Firebase Auth + JWT

---

## ⚙️ 1. Vercel Project Configuration

When importing your Git repository into Vercel:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | **Other** | Allows custom build script handling |
| **Root Directory** | `./` (Root) | Leave at repository root |
| **Build Command** | `npm run vercel-build` | Automatically runs Prisma generate, builds backend, and builds Vite frontend |
| **Output Directory** | `frontend/dist` | Serves compiled static assets with SPA routing |
| **Install Command** | `npm install` | Installs root, frontend, and backend dependencies |

---

## 🔑 2. Complete Vercel Environment Variables

Add the following environment variables in **Vercel Project Settings ➔ Environment Variables** (apply to **Production**, **Preview**, and **Development**):

### A. Database (Supabase PostgreSQL & Prisma)
```bash
# Transaction connection pooler (Port 6543) - Required for serverless functions
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15&pool_timeout=20"

# Direct connection (Port 5432) - Used for Prisma migrations and schema syncing
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

> **Important**: Always include `?pgbouncer=true&connection_limit=15&pool_timeout=20` on your `DATABASE_URL` so serverless functions do not exhaust PostgreSQL connection limits.

### B. Backend & Security
```bash
# Server environment
NODE_ENV="production"
PORT="5001"
DEMO_MODE="true"

# JWT Token Secret (Replace with a strong random string)
JWT_SECRET="elap-super-secret-jwt-key-for-development-mode-2026"

# Scheduled Jobs / Cron secret key
CRON_SECRET="elap-cron-secret-2026"

# Permitted Client Origins for CORS (Vercel domains are also dynamically allowed)
CLIENT_URL="https://your-app-name.vercel.app"
SOCKET_ORIGIN="https://your-app-name.vercel.app"
```

### C. Firebase Authentication (Backend Admin SDK)
```bash
FIREBASE_PROJECT_ID="elap-9f40a"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@elap-9f40a.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```
*(Note: If private key is omitted, backend automatically falls back safely to DEMO_MODE).*

### D. Email & Storage Services (Resend & Cloudinary)
```bash
# Resend Email Service
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="ELAP Portal <notifications@elap.domain>"

# Cloudinary (Optional - Fallback base64 mode enabled if omitted)
CLOUDINARY_CLOUD_NAME="elap_demo"
CLOUDINARY_API_KEY="1234567890"
CLOUDINARY_API_SECRET="demo_secret_key"
```

### E. Frontend Environment Variables (Vite Client-side)
Prefix with `VITE_`:
```bash
# Base URL for API calls (Optional: defaults to relative /api/v1 in production automatically)
VITE_API_BASE_URL="/api/v1"

# Firebase Client Web Configuration
VITE_FIREBASE_API_KEY="AIzaSyC88vK6YXOyphhwLzzD-6Aoth1G71lHO5I"
VITE_FIREBASE_AUTH_DOMAIN="elap-9f40a.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="elap-9f40a"
VITE_FIREBASE_STORAGE_BUCKET="elap-9f40a.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="96732084695"
VITE_FIREBASE_APP_ID="1:96732084695:web:3aeb0c3cf458e982497392"
```

---

## 🛠️ 3. Verification & Deploy Steps

1. **Push Changes to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete mobile UI responsiveness and vercel serverless deployment configuration"
   git push origin main
   ```
2. **Import Repository in Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your repository.
   - Set the Environment Variables listed above.
   - Click **Deploy**.
3. **Run Initial Database Migration (if new database)**:
   If deploying to a fresh database, run migrations locally using your `DIRECT_URL`:
   ```bash
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   npx prisma db seed --schema=backend/prisma/schema.prisma
   ```
