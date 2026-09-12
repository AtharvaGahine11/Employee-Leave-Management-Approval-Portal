import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApprovalService } from "@/lib/server/services/approval.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const userRole = (session.user as any).role;
  const actorId = (session.user as any).id;
  const actorName = session.user.name || "Approver";

  if (userRole !== "MANAGER" && userRole !== "HR") {
    return NextResponse.json({ error: "Forbidden: Only managers and HR can approve requests." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const remarks = body.remarks || "";

    let result;
    if (userRole === "MANAGER") {
      result = await ApprovalService.managerReview({
        requestId: id,
        actorId,
        actorName,
        approved: true,
        remarks,
      });
    } else {
      result = await ApprovalService.hrReview({
        requestId: id,
        actorId,
        actorName,
        approved: true,
        remarks,
      });
    }

    return NextResponse.json({ success: true, request: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Approval action failed" }, { status: 400 });
  }
}
