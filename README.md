# ELAP - Employee Leave Management & Approval Portal

[![Stack](https://img.shields.io/badge/Stack-React_18_%7C_Vite_%7C_Node.js_%7C_Express_%7C_Prisma-4f46e5)](https://github.com/AtharvaGahine11/Employee-Leave-Management-Approval-Portal)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A centralized, production-style, enterprise Web Application for **Employee Leave Management & Approval (ELAP)**. ELAP replaces fragmented email threads and Excel spreadsheets with a structured digital workflow, 2-tier approval engine (`Reporting Manager` → `HR`), real-time balance calculations, automated SLA reminders/escalations, and an immutable audit log across **8 configurable departments**.

---

## 1. Product Overview

ELAP serves as the **authoritative system of record** for all organizational leave operations:
- **Employee**: Create leave requests, view leave balances, save drafts, track real-time request status, add comments, upload medical attachments, and cancel eligible requests.
- **Reporting Manager**: Tier 1 review action desk to approve or reject team requests with mandatory rejection comments, view team history, and receive 48h SLA reminders.
- **HR Lead**: HR Command Center with organization-wide visibility across all 8 departments, Tier 2 final approvals with atomic balance deductions, CSV report export, and immutable audit history.

---

## 2. Key Features

- **2-Tier Approval Workflow Engine**: `EMPLOYEE` → `REPORTING MANAGER` (Tier 1) → `HR` (Tier 2 Final Approval).
- **Leave Entitlements & Real-Time Balance Engine**:
  - **CL (Casual Leave)**: 12 days/year, max 3 consecutive days limit.
  - **SL (Sick Leave)**: 12 days/year, medical certificate attachment required for $\ge 3$ consecutive days.
  - **EL (Earned Leave)**: 15 days/year, carry-forward up to 30 days, minimum 3 days advance notice.
  - Formula: $\text{Available Balance} = \text{Opening Balance} - (\text{Approved Leaves} + \text{Pending Leaves})$.
- **Automated SLA Inaction Rules**:
  - **48-Hour Manager Inaction**: Automated email & in-portal reminder sent to manager.
  - **72-Hour Manager Inaction**: Request auto-escalated to `ESCALATED` status on HR Command Center.
- **Role-Based Access Control (RBAC)**: Strict route and backend record-level data scope guards.
- **Real-Time WebSockets & Notifications**: Socket.IO event broadcasting for notifications & comment threads.
- **Immutable Audit Trail**: Append-only log recording every status transition with actor, action, timestamp, and metadata.
- **HR Reports & CSV Export**: Filtered export matching department, status, leave type, and date range.

---

## 3. Technology Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** visual primitives
- **React Router v6** (Client-side routing with guards)
- **Axios** (API HTTP Client with Bearer Token interceptor)
- **Socket.IO Client** (Real-time WebSockets)
- **Recharts** (Department breakdown & leave distribution charts)
- **Lucide React** (Modern enterprise icons)

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **Prisma ORM** (PostgreSQL / Supabase compatible)
- **Firebase Admin SDK** (ID Token verification)
- **Socket.IO** (WebSockets server engine)
- **Resend** (Email notifications)
- **Cloudinary** (Attachment storage)
- **Helmet** + **CORS** + **Express Rate Limit** (API Security)

---

## 4. Repository Structure

```
ELAP/
├── frontend/             # React + Vite + TypeScript Frontend SPA
│   ├── src/
│   │   ├── api/          # Axios HTTP services & endpoints
│   │   ├── components/   # UI primitives, layout, forms, charts
│   │   ├── contexts/     # AuthContext, SocketContext, ToastContext
│   │   ├── pages/        # Employee, Manager, HR portals & Auth
│   │   ├── routes/       # ProtectedRoute & RoleRoute guards
│   │   └── types/        # TypeScript interfaces & DTOs
│   ├── package.json
│   └── vite.config.ts
│
├── backend/              # Node.js + Express + Prisma Backend
│   ├── prisma/
│   │   ├── schema.prisma # Complete database schema
│   │   └── seed.ts       # 8 departments, demo users, sample requests
│   ├── src/
│   │   ├── config/       # Env, Prisma, Firebase, Cloudinary, Resend
│   │   ├── middleware/   # Auth & RBAC guards, central error handler
│   │   ├── modules/      # Auth, Employees, Leaves, Approvals, Reports, Audit
│   │   ├── socket/       # Socket.IO connection & room emitters
│   │   └── server.ts     # Express server entrypoint
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                 # Architecture, API, Database, Deployment & Testing docs
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Local Setup & Quick Start

### Prerequisites
- **Node.js**: v18 or higher
- **NPM**: v9 or higher

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/AtharvaGahine11/Employee-Leave-Management-Approval-Portal.git
   cd ELAP
   ```

2. **Install Workspace Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `backend/.env` and `frontend/.env` (configured with `DEMO_MODE=true` out-of-the-box for instant local testing).

4. **Initialize Database & Seed Demo Data**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Start Development Servers (Backend + Frontend)**:
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000/api/v1`

---

## 6. Demo Accounts (1-Click Login)

The login screen features **1-Click Demo Login buttons** for instant evaluation:

| Role | Email | Password | Access & Scope |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@elap.com` | `password123` | Submit leaves, track status, view own balances & history |
| **Manager** | `manager@elap.com` | `password123` | Tier 1 Action Desk, approve/reject team requests, team history |
| **HR Lead** | `hr@elap.com` | `password123` | HR Command Center, Tier 2 final sign-off, CSV export, audit logs |

---

## 7. Documentation Index

- [Architecture Design](docs/architecture.md)
- [Database Schema & ER Model](docs/database.md)
- [REST API Specifications](docs/api.md)
- [Deployment Guide (Vercel + Render)](docs/deployment.md)
- [Testing & Verification Guide](docs/testing.md)

---

## 8. License

Distributed under the MIT License. See `LICENSE` for details.
