import { prisma } from "@/lib/server/prisma";
import { dataStore } from "@/lib/data/store";
import { formatDate } from "@/lib/utils";

export class ReportService {
  /**
   * Generates a clean CSV string of all leave records for HR reporting.
   */
  static async exportLeaveRecordsCSV() {
    let records: Array<any> = [];

    try {
      records = await prisma.leaveRequest.findMany({
        include: {
          employee: { include: { department: true } },
          manager: true,
          hr: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      // Prototype data fallback
      records = dataStore.getLeaveRequests().map((r) => ({
        requestId: r.requestId,
        employee: { name: r.employeeName, employeeId: r.employeeId, department: { name: r.departmentName } },
        leaveType: r.leaveType,
        startDate: new Date(r.startDate),
        endDate: new Date(r.endDate),
        totalDays: r.totalDays,
        status: r.status,
        manager: { name: r.managerName || "N/A" },
        managerRemarks: r.managerRemarks || "",
        hr: { name: r.hrName || "N/A" },
        hrRemarks: r.hrRemarks || "",
        createdAt: new Date(r.createdAt),
      }));
    }

    const headers = [
      "Request Number",
      "Employee Name",
      "Employee ID",
      "Department",
      "Leave Type",
      "Start Date",
      "End Date",
      "Total Working Days",
      "Status",
      "Manager Name",
      "Manager Remarks",
      "HR Name",
      "HR Remarks",
      "Application Created At",
    ];

    const rows = records.map((r) => [
      r.requestId,
      `"${r.employee?.name || r.employeeName || ""}"`,
      r.employee?.employeeId || r.employeeId || "",
      `"${r.employee?.department?.name || r.departmentName || ""}"`,
      r.leaveType,
      formatDate(r.startDate.toISOString ? r.startDate.toISOString() : r.startDate),
      formatDate(r.endDate.toISOString ? r.endDate.toISOString() : r.endDate),
      r.totalDays,
      r.status,
      `"${r.manager?.name || r.managerName || "N/A"}"`,
      `"${(r.managerRemarks || "").replace(/"/g, '""')}"`,
      `"${r.hr?.name || r.hrName || "N/A"}"`,
      `"${(r.hrRemarks || "").replace(/"/g, '""')}"`,
      formatDate(r.createdAt.toISOString ? r.createdAt.toISOString() : r.createdAt),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    return csvContent;
  }
}
