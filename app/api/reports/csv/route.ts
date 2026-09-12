import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ReportService } from "@/lib/server/services/report.service";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== "HR") {
    return NextResponse.json({ error: "Forbidden: CSV reports accessible only to HR." }, { status: 403 });
  }

  try {
    const csvContent = await ReportService.exportLeaveRecordsCSV();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="elap_leave_report_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "CSV generation failed" }, { status: 500 });
  }
}
