# ELAP — Employee Leave Management & Approval Portal
**Sprint 1 Deliverable: Authentication + Data Foundation & Two-Tier Approval Workflow**

ELAP is an enterprise-grade internal Human Resources leave management web application designed to replace unstructured email threads and fragmented Microsoft Excel trackers with a single source of truth, automated multi-tier approvals, and complete compliance audit logging.

---

## 🎯 Sprint 1 Capabilities Demonstrated

1. **Authentication & Session Management**:
   - Modular authentication layer (`IAuthService` & `MockAuthService`) designed for drop-in replacement with Auth.js / Supabase Auth.
   - 1-Click fast demo credential fill on the login screen.
   - Client session persistence in browser storage with automatic role authorization checks.
2. **Role-Based Access Control**:
   - **Employee (`EMPLOYEE`)**: View personal leave quotas (Casual, Sick, Earned), apply for leave with duration computation & quota validation, track live request status, and cancel pending applications.
   - **Reporting Manager (`MANAGER`)**: First-tier review dashboard, team leave capacity tracking, pending requests approval, and final rejection with mandatory justification.
   - **HR Operations (`HR`)**: Organization-wide dashboard across all **8 departments**, second-tier final authorization (which officially deducts balances), employee directory, and immutable audit trail.
3. **8 BRD-Specified Business Departments**:
   - Engineering (ENG)
   - Product (PROD)
   - Human Resources (HR)
   - Finance (FIN)
   - Sales (SALES)
   - Marketing (MKTG)
   - Operations (OPS)
   - Customer Support (CS)
4. **Enforced Business Rules**:
   - Two-tier mandatory approval: Employee $\rightarrow$ Manager $\rightarrow$ HR.
   - Manager rejection is final and stops the workflow.
   - Leave balance deduction occurs **strictly after final HR approval**.
   - Insufficient quota check prevents over-application.
   - Overlapping date check prevents double-booking.
   - Cancellation permitted before final HR authorization.
5. **Data Architecture**:
   - PostgreSQL-compatible schema defined in [`prisma/schema.prisma`](./prisma/schema.prisma).
   - Domain TypeScript contracts in [`types/index.ts`](./types/index.ts).
   - Data Access Layer in [`lib/data/store.ts`](./lib/data/store.ts).

---

## 🔑 Demo Accounts

| Role | Email | Password | Primary Persona | Scope |
|---|---|---|---|---|
| **Employee** | `employee@elap.demo` | `employee123` | **Sneha Kulkarni** (Senior Software Engineer) | Personal balances & applications |
| **Manager** | `manager@elap.demo` | `manager123` | **Rahul Nair** (Engineering Lead) | Team approval queue & engineering roster |
| **HR Admin** | `hr@elap.demo` | `hr123` | **Priya Patel** (HR Operations Lead) | Organization-wide & final authorization |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 🎬 18-Step Stakeholder Demo Flow

Follow these steps for an interactive client walkthrough:

1. **Open Login**: Go to `http://localhost:3000/login`. Notice the corporate enterprise branding, security tags, and 1-click demo buttons.
2. **Login as Employee**: Click the **Employee** demo button (`employee@elap.demo`) and press **Sign In**.
3. **Employee Dashboard**: Inspect the greeting *"Good morning, Sneha Kulkarni"*, 3 balance cards (CL: 10/12, SL: 12/12, EL: 15/15), and recent requests table.
4. **Employee Profile**: Navigate to **My Profile** from the sidebar; review organizational hierarchy showing Rahul Nair as reporting manager.
5. **Apply for Leave**: Click **Apply for Leave** (or the header CTA).
6. **Submit Request**:
   - Select **Sick Leave (SL)**.
   - Pick dates (e.g. 2 working days). Notice the calculated duration dynamically updates.
   - Enter reason: *"Viral fever and doctor prescribed rest"*.
   - Click **Submit Leave Request**.
   - Notice the toast confirmation and new status: `PENDING_MANAGER`.
7. **Logout**: Click **Logout** in the top navigation.
8. **Login as Manager**: Click the **Manager** demo button (`manager@elap.demo`) and sign in.
9. **Manager Dashboard**: View the **Pending Leave Approvals** table; find Sneha's new request.
10. **Inspect Request**: Click **View** to inspect details and reason.
11. **Approve Request**: Click **Approve**. Notice the request advances to `PENDING_HR`.
12. **Logout**: Click **Logout**.
13. **Login as HR**: Click the **HR Admin** demo button (`hr@elap.demo`) and sign in.
14. **HR Dashboard**: View the organization metrics across all **8 departments**, the visual leave distribution chart, and the requests under `PENDING_HR`.
15. **Inspect & Final Approve**: Click **Final Approve** on Sneha's request.
16. **Balance Deduction**: Verify status updates to `APPROVED` and Sneha's quota is officially updated.
17. **Audit Trail**: Open **Audit Trail** from the sidebar; inspect the complete immutable event sequence:
   - `LEAVE_SUBMITTED` (by Sneha Kulkarni)
   - `MANAGER_APPROVED` (by Rahul Nair)
   - `HR_APPROVED` (by Priya Patel)
18. **Departments & Directory**: Visit **Departments** to see all 8 business units and **Employees** to see organization staff records.

---

## 🏗️ Architecture & Extensibility

```
├── app/
│   ├── layout.tsx         # Root layout with AuthProvider & ToastProvider
│   ├── page.tsx           # Entry redirect
│   ├── login/page.tsx     # Enterprise login screen with 1-click accounts
│   ├── dashboard/page.tsx # Dynamic role-aware dashboard (Employee, Manager, HR)
│   ├── profile/page.tsx   # Profile & organizational hierarchy
│   ├── leave/
│   │   ├── apply/page.tsx # Leave application with balance validation
│   │   └── history/page.tsx # Filterable leave records
│   ├── approvals/page.tsx # Manager & HR queue
│   ├── employees/page.tsx # HR staff directory
│   ├── departments/page.tsx # 8 departments breakdown
│   ├── team/page.tsx      # Manager team roster
│   └── audit/page.tsx     # Compliance audit trail
├── components/
│   ├── layout/AppShell.tsx # Responsive sidebar, drawer, header, role switcher
│   ├── dashboard/         # EmployeeDashboard, ManagerDashboard, HrDashboard
│   └── ui/                # Button, Card, Badge, Modal, Toast
├── lib/
│   ├── auth/              # IAuthService, MockAuthService, AuthContext
│   ├── data/store.ts      # Data access layer & local storage persistence
│   └── utils.ts           # Utilities, date formatters, status badge tokens
├── prisma/
│   └── schema.prisma      # PostgreSQL data model specification
└── types/
    └── index.ts           # Shared TypeScript interfaces
```
