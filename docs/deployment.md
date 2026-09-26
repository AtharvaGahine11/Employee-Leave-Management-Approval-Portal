# ELAP Deployment Guide

## Deployment Environments

1. **Frontend**: Vercel (SPA deployment)
   - Build command: `npm run build`
   - Output directory: `dist`
   - Routing: Configure rewrite rule to `/index.html` for client-side routing.

2. **Backend**: Render / Railway (Node.js Web Service)
   - Build command: `npm run build`
   - Start command: `npm start`
   - Node version: 18+

3. **Database**: Supabase PostgreSQL
   - Run Prisma migration: `npx prisma migrate deploy`
   - Run database seed: `npx prisma db seed`

4. **Scheduled SLA Cron Jobs**: Render Cron Jobs
   - Trigger endpoint: `POST /api/v1/cron/sla-check`
   - Schedule: `0 * * * *` (Hourly check)
   - Secret Header: `x-cron-secret: <CRON_SECRET>`
