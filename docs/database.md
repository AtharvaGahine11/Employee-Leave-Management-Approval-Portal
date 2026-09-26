# ELAP Database Documentation

## Entity Relationship Overview

The ELAP database is managed via **Prisma ORM** targeting **PostgreSQL (Supabase)**.

### Core Entities
1. `Department`: 8 pre-seeded organizational departments (`IT`, `FIN`, `MKT`, `PROC`, `LEG`, `OPS`, `ADMIN`, `CS`).
2. `Employee`: Employee profiles with self-referential reporting manager relationships (`managerId`).
3. `LeaveType`: Configurable entitlements (`CL`: 12 days, `SL`: 12 days, `EL`: 15 days).
4. `LeaveBalance`: Tracks annual balances:
   - Formula: $\text{Available} = \text{Opening} - (\text{Approved} + \text{Pending})$
5. `LeaveRequest`: Central leave applications.
6. `Approval`: Multi-tier approval decisions with mandatory comments.
7. `Comment`: Per-request in-portal discussion thread.
8. `Attachment`: Metadata for uploaded medical certificates/documents.
9. `AuditLog`: Immutable append-only audit trail.
10. `Notification`: In-portal notifications center.
