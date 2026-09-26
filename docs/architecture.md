# ELAP Architecture Documentation

## 1. System Overview

**ELAP (Employee Leave Management & Approval Portal)** is built as a production-grade full-stack Web Application following a **Modular Monolith** pattern.

### Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router v6, Axios, Socket.IO Client, Recharts, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL (Supabase), Firebase Admin SDK, Socket.IO, Resend, Cloudinary.
- **Database**: PostgreSQL / Supabase with Prisma ORM.

---

## 2. 2-Tier Approval Workflow State Machine

```
   [DRAFT]
      │
      ▼ (Submit)
[PENDING_MANAGER] ────── (72h Inaction) ─────► [ESCALATED]
   │          │                                   │       │
   │ (Approve)│ (Reject with Comment)             │(Approve) (Reject)
   ▼          ▼                                   ▼       ▼
[PENDING_HR] [REJECTED_BY_MANAGER]            [APPROVED] [REJECTED_BY_HR]
   │          │
   │ (Approve)│ (Reject with Comment)
   ▼          ▼
[APPROVED] [REJECTED_BY_HR]
```

### Key Business Rules
1. **Manager Rejection**: Terminal state (`REJECTED_BY_MANAGER`). Pending leave balance is released immediately.
2. **HR Approval**: Final decision state (`APPROVED`). Leave balance is permanently finalized within an atomic PostgreSQL transaction.
3. **Cancellation**: Allowed only before final HR approval (`CANCELLED`). Restores pending balance.
4. **Mandatory Rejection Comment**: Rejections require an explicit, non-empty comment.

---

## 3. Security & RBAC Enforcements

- **Authentication**: JWT / Firebase Bearer ID Tokens verified by backend Express middleware (`authMiddleware.ts`).
- **Authorization**: Role-Based Access Control enforced at backend route level (`rbacMiddleware.ts`) for `EMPLOYEE`, `MANAGER`, and `HR`.
- **Data Scope Isolation**:
  - `EMPLOYEE`: Access strictly restricted to own leave records.
  - `MANAGER`: Access scoped to direct reporting team members.
  - `HR`: Full organization-wide visibility across all 8 departments.
