# ELAP REST API Specification

Base URL: `/api/v1`

## Authentication
- `POST /auth/login` - Authenticate user & return JWT token + user profile.
- `GET /auth/session` - Get current user profile & leave balances.

## Employee & Leaves
- `GET /employees/profile` - Get authenticated profile details.
- `GET /employees/team` - List direct reports (Manager view).
- `POST /leaves` - Create or save draft leave request.
- `GET /leaves` - List employee's leave requests.
- `GET /leaves/balances` - List leave balances.
- `GET /leaves/:id` - Detailed request view.
- `POST /leaves/:id/submit` - Submit draft request.
- `POST /leaves/:id/cancel` - Cancel request (before final HR approval).

## Manager Approvals
- `GET /manager/leaves` - Get team requests pending manager review.
- `POST /manager/leaves/:id/approve` - Approve request (forward to HR).
- `POST /manager/leaves/:id/reject` - Reject request (Requires `{ comment }`).

## HR Management & Reports
- `GET /hr/leaves` - Organization-wide leave requests (all 8 departments).
- `POST /hr/leaves/:id/approve` - Final HR approval (Atomic DB transaction).
- `POST /hr/leaves/:id/reject` - Final HR rejection (Requires `{ comment }`).
- `GET /reports/leaves` - HR Analytics summary.
- `GET /reports/leaves/export` - Export filtered report as CSV download.
- `GET /hr/audit` - Organization-wide immutable audit trail.
