# Employee Leave Management & Approval Portal (ELAP)

ELAP is an enterprise-grade **Employee Leave Management & Approval Portal** built with Next.js 14 App Router, TypeScript, Auth.js (NextAuth.js v5), Prisma ORM, and PostgreSQL. It replaces manual email trails and spreadsheets with a centralized, two-tier leave approval workflow, real-time balance tracking, audit logging, email notifications, CSV reporting, and automated reminders.

---

## 🌟 Architecture & Highlights

- **Next.js 14 App Router**: Clean decoupled service-repository architecture using modern Server Components, Route Handlers, and React Server Actions.
- **Dark Glass Design System**: High-fidelity UI using Vanilla CSS, Tailwind CSS 3.4, and shadcn/ui patterns (`backdrop-blur-2xl`, glass containers, custom glowing badge highlights, responsive mobile console drawer).
- **PostgreSQL & Prisma ORM**: Normalized relational schema with strict models for `User`, `Department`, `Employee`, `LeaveBalance`, `LeaveRequest`, `LeaveComment`, `LeaveAttachment`, `LeaveAuditLog`, and `Notification`.
- **Auth.js v5 & JWT Sessions**: Secure Credentials authentication, password hashing with `bcryptjs`, 30-minute inactivity session expiration, and dual-layer RBAC.
- **Two-Tier Approval Workflow**: Employee submission $\rightarrow$ Manager endorsement $\rightarrow$ Final HR authorization $\rightarrow$ Live quota deduction.
- **Audit Trail & Governance**: Immutable, append-only audit logging recording every status transition, actor ID, timestamp, and remarks.
- **Vercel Cron Reminders**: Idempotent background cron jobs sending 48-hour pending reminders and 72-hour manager escalations.
- **HR Analytics & CSV Export**: Server-side filtering across all 8 corporate departments and instant CSV report export.

---

## 🚀 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14.2 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Next.js Route Handlers, TypeScript, Service-Repository Architecture |
| **Database** | PostgreSQL (Supabase compatible), Prisma ORM 5.22 |
| **Authentication** | Auth.js (NextAuth.js v5), Credentials Provider, `bcryptjs` password hashing |
| **Email** | Resend API (Event-driven email delivery) |
| **Storage** | Uploadthing / Cloudinary |
| **Scheduled Jobs**| Vercel Cron (`/api/cron/reminders`) |
| **Hosting** | Vercel |

---

## 📂 Project Structure

```
ELAP/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth.js v5 route handler
│   │   ├── leave-requests/         # Leave CRUD & filtering routes
│   │   │   └── [id]/
│   │   │       ├── approve/        # Manager & HR approval route
│   │   │       ├── reject/         # Rejection with mandatory comments
│   │   │       ├── cancel/         # Employee cancellation
│   │   │       └── comments/       # Request discussion thread
│   │   ├── employees/              # Employee roster endpoints
│   │   ├── departments/            # Corporate departments endpoint
│   │   ├── audit-logs/             # Immutable audit log endpoint
│   │   ├── reports/csv/            # HR CSV report export handler
│   │   └── cron/reminders/         # Vercel Cron 48h/72h job
│   ├── approvals/                  # Manager & HR review queue page
│   ├── audit/                      # Audit trail page (HR)
│   ├── dashboard/                  # Role-based dashboard router
│   ├── departments/                # Department overview page (HR)
│   ├── employees/                  # Employee management page (HR)
│   ├── leave/
│   │   ├── apply/                  # Leave application form page
│   │   └── history/                # Employee leave history page
│   ├── leave-requests/             # All leave requests page (HR)
│   ├── login/                      # Login page with 1-click personas
│   ├── profile/                    # User profile page
│   └── team/                       # Team roster page (Manager)
├── components/
│   ├── dashboard/                  # Employee, Manager & HR dashboard views
│   ├── layout/                     # AppShell floating sidebar & header
│   └── ui/                         # Glass UI components (Button, Badge, Card, Modal, Toast)
├── lib/
│   ├── auth/                       # Client AuthContext & session helpers
│   ├── data/                       # Prototype store & seed data structures
│   ├── server/
│   │   ├── prisma.ts               # Prisma Client singleton instance
│   │   ├── services/               # Business logic (leave, balance, approval, audit, cron, report, notification)
│   │   └── validators/             # Zod validation schemas
│   └── utils.ts                    # Working days calculator & date formatters
├── prisma/
│   ├── schema.prisma               # PostgreSQL Prisma schema
│   └── seed.ts                     # Database seeder (8 departments, 10 employees, balances)
├── tests/
│   └── elap-workflow.test.ts       # Core suite & workflow tests
├── auth.ts                         # NextAuth v5 configuration
├── middleware.ts                   # Route protection & server-side RBAC guards
├── vercel.json                     # Vercel Cron configuration
└── README.md
```

---

## 🔐 Demo User Credentials

The portal comes pre-configured with 1-click persona logins on the `/login` page:

| Role | Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **EMPLOYEE** | Sneha Kulkarni | `employee@elap.demo` | `employee123` | Submit leave requests, check live quota, cancel pending requests, view leave history. |
| **MANAGER** | Rahul Nair | `manager@elap.demo` | `manager123` | Review team requests (Tier 1 endorsement/rejection with mandatory comments), team roster. |
| **HR** | Priya Patel | `hr@elap.demo` | `hr123` | Organization-wide visibility across all 8 departments, Tier 2 final sign-off, CSV export, audit trail. |

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

```env
# Database Configuration (PostgreSQL / Supabase)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elap_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/elap_db?schema=public"

# Auth.js / NextAuth.js v5 Secrets
AUTH_SECRET="elap_production_super_secret_jwt_key_2026_change_me"
NEXTAUTH_URL="http://localhost:3000"

# Email Provider (Resend)
RESEND_API_KEY="re_placeholder_key_for_development"
RESEND_FROM_EMAIL="ELAP Notifications <notifications@elap.portal>"

# File Storage
UPLOADTHING_TOKEN="ut_placeholder_token"

# Vercel Cron Secret
CRON_SECRET="elap_cron_secure_token_2026"
```

---

## 🛠️ Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Database Seeding** *(Requires PostgreSQL server running at `DATABASE_URL`)*:
   ```bash
   npx prisma db seed
   ```

4. **Run Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the automated test suite covering working day calculations, Zod validation, mandatory rejection comments, two-tier approval workflow, audit trail logging, CSV report generation, and Cron jobs:

```bash
npx tsx --test tests/elap-workflow.test.ts
```

Run TypeScript compilation check:

```bash
npx tsc --noEmit
```

Build production bundle:

```bash
npm run build
```

---

## 📑 Business Rules & Approval Workflow Summary

1. **Leave Quotas**:
   - **CL (Casual Leave)**: 12 days/year. Maximum 3 consecutive days per request.
   - **SL (Sick Leave)**: 12 days/year. Medical certificate required for $\ge 3$ consecutive days.
   - **EL (Earned Leave)**: 15 days/year. Accrues at 1.25 days/month. Must be requested at least 3 days in advance.
2. **Quota Deduction Policy**:
   - Available balance = $\text{Annual Quota} - \text{Approved Leaves} - \text{Pending Leaves}$.
   - Pending requests reserve balance.
   - **Balance is permanently deducted ONLY when HR grants final Tier 2 approval.**
3. **Approval Flow**:
   - `EMPLOYEE` Submits $\rightarrow$ `PENDING_MANAGER` $\rightarrow$ `MANAGER` Endorses $\rightarrow$ `PENDING_HR` $\rightarrow$ `HR` Approves $\rightarrow$ `APPROVED`.
   - Manager Rejection $\rightarrow$ `REJECTED_BY_MANAGER` (Final, does not reach HR).
   - Rejection comments are **mandatory** for both Manager and HR tiers.
