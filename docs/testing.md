# ELAP Testing Strategy & Verification Guide

## Testing Workflow

1. **Authentication & RBAC**:
   - Log in as `employee@elap.com`: Verify restricted to own profile & leaves. Cannot access `/manager` or `/hr` routes.
   - Log in as `manager@elap.com`: Verify access to team approvals desk. Cannot access HR administrative routes.
   - Log in as `hr@elap.com`: Verify full access to HR Command Center, all 8 departments, CSV exports, and audit logs.

2. **Leave Application & Validation**:
   - Verify CL consecutive days rule (max 3 days).
   - Verify SL medical certificate warning flag if ≥ 3 days.
   - Verify EL advance notice rule.
   - Verify overlapping date prevention.
   - Verify balance deduction calculation: $\text{Available} = \text{Opening} - (\text{Approved} + \text{Pending})$.

3. **2-Tier Approval Flow**:
   - Submit leave as Employee → Status becomes `PENDING_MANAGER`.
   - Approve as Manager → Status becomes `PENDING_HR`.
   - Final Approve as HR → Status becomes `APPROVED`, balance permanently finalized.
   - Verify mandatory comment on Rejections.
