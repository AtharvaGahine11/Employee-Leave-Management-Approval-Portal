import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AuditService } from "@/lib/server/services/audit.service";
import { dataStore } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== "HR") {
    return NextResponse.json({ error: "Forbidden: Audit logs accessible only to HR." }, { status: 403 });
  }

  try {
    const logs = await AuditService.getAuditTrail();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    const logs = dataStore.getAuditLogs();
    return NextResponse.json({ success: true, logs });
  }
}
