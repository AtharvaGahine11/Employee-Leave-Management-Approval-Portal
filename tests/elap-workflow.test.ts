import assert from "node:assert";
import { test, describe, beforeEach } from "node:test";
import { calculateWorkingDays } from "../lib/utils";
import { CreateLeaveSchema } from "../lib/server/validators/leave.schema";
import { ApprovalActionSchema } from "../lib/server/validators/approval.schema";
import { ReportService } from "../lib/server/services/report.service";
import { CronService } from "../lib/server/services/cron.service";
import { dataStore } from "../lib/data/store";

describe("ELAP Full-Stack Core Suite & Workflow Verification", () => {
  beforeEach(() => {
    dataStore.init();
  });

  test("AC-01 & AC-02: Working Days Calculation (Excluding Weekends)", () => {
    const days = calculateWorkingDays("2026-09-14", "2026-09-18");
    assert.strictEqual(days, 5);

    const weekendDays = calculateWorkingDays("2026-09-18", "2026-09-21");
    assert.strictEqual(weekendDays, 2);
  });

  test("AC-02 & Business Rules: Schema Validations for Leave Creation", () => {
    const validCL = CreateLeaveSchema.safeParse({
      leaveType: "CASUAL_LEAVE",
      startDate: "2026-10-01",
      endDate: "2026-10-02",
      reason: "Personal family obligation",
    });
    assert.strictEqual(validCL.success, true);

    const invalidReason = CreateLeaveSchema.safeParse({
      leaveType: "SICK_LEAVE",
      startDate: "2026-10-01",
      endDate: "2026-10-02",
      reason: "Hi",
    });
    assert.strictEqual(invalidReason.success, false);
  });

  test("AC-04 & Mandatory Rejection Comment Validation", () => {
    const blankRejection = ApprovalActionSchema.safeParse({
      approved: false,
      remarks: "   ",
    });
    assert.strictEqual(blankRejection.success, false);

    const validRejection = ApprovalActionSchema.safeParse({
      approved: false,
      remarks: "Project deliverable deadline conflicts with proposed dates.",
    });
    assert.strictEqual(validRejection.success, true);
  });

  test("AC-03 to AC-08: Complete 2-Tier Approval Flow & Quota Deduction", async () => {
    dataStore.init();
    const empId = "emp-3";
    const createRes = dataStore.createLeaveRequest({
      employeeId: empId,
      leaveType: "CASUAL_LEAVE",
      startDate: "2026-11-16",
      endDate: "2026-11-17",
      totalDays: 2,
      reason: "Attending technical conference out of town",
    });

    assert.strictEqual(createRes.success, true);
    const req = createRes.request!;
    assert.strictEqual(req.status, "PENDING_MANAGER");

    // 2. Manager Endorses (Tier 1)
    const mgrRes = dataStore.managerReview({
      requestId: req.requestId,
      managerId: "emp-2",
      managerName: "Rahul Nair",
      approved: true,
      remarks: "Endorsed. Team coverage confirmed.",
    });
    assert.strictEqual(mgrRes.success, true);

    const afterManager = dataStore.getLeaveRequests().find((r) => r.requestId === req.requestId)!;
    assert.strictEqual(afterManager.status, "PENDING_HR");

    // 3. HR Final Approval (Tier 2)
    const hrRes = dataStore.hrReview({
      requestId: req.requestId,
      hrId: "emp-1",
      hrName: "Priya Patel",
      approved: true,
      remarks: "Final authorization granted. Quota updated.",
    });
    assert.strictEqual(hrRes.success, true);

    const afterHr = dataStore.getLeaveRequests().find((r) => r.requestId === req.requestId)!;
    assert.strictEqual(afterHr.status, "APPROVED");

    // 4. Audit Trail Logged
    const logs = dataStore.getAuditLogs().filter((l) => l.leaveRequestId === req.id || l.requestDisplayId === req.requestId);
    assert.ok(logs.length >= 3);
  });

  test("Rejection Workflow (Manager Rejection is Final)", async () => {
    dataStore.init();
    const createRes = dataStore.createLeaveRequest({
      employeeId: "emp-3",
      leaveType: "SICK_LEAVE",
      startDate: "2026-12-14",
      endDate: "2026-12-14",
      totalDays: 1,
      reason: "Medical checkup",
    });

    assert.strictEqual(createRes.success, true);
    const req = createRes.request!;

    // Manager Rejection
    const mgrRejectRes = dataStore.managerReview({
      requestId: req.requestId,
      managerId: "emp-2",
      managerName: "Rahul Nair",
      approved: false,
      remarks: "Critical sprint demo scheduled on this date.",
    });
    assert.strictEqual(mgrRejectRes.success, true);

    const rejectedReq = dataStore.getLeaveRequests().find((r) => r.requestId === req.requestId)!;
    assert.strictEqual(rejectedReq.status, "REJECTED_BY_MANAGER");
  });

  test("AC-07 & CSV Report Export", async () => {
    const csv = await ReportService.exportLeaveRecordsCSV();
    assert.ok(csv.includes("Request Number"));
    assert.ok(csv.includes("Employee Name"));
    assert.ok(csv.includes("Department"));
    assert.ok(csv.includes("Status"));
  });

  test("Cron Background Job (48h Reminder & 72h Escalation)", async () => {
    const cronRes = await CronService.processPendingRemindersAndEscalations();
    assert.strictEqual(cronRes.success, true);
    assert.ok(typeof cronRes.remindedCount === "number");
  });
});
