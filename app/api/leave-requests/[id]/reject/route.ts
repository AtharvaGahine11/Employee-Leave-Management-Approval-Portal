import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApprovalService } from "@/lib/server/services/approval.service";
import { ApprovalActionSchema } from "@/lib/server/validators/approval.schema";

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
  const actorName = session.user.name || "Reviewer";

  if (userRole !== "MANAGER" && userRole !== "HR") {
    return NextResponse.json({ error: "Forbidden: Only managers and HR can reject requests." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = ApprovalActionSchema.safeParse({ approved: false, remarks: body.remarks });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed: Mandatory rejection comment is required.", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let result;
    if (userRole === "MANAGER") {
      result = await ApprovalService.managerReview({
        requestId: id,
        actorId,
        actorName,
        approved: false,
        remarks: body.remarks,
      });
    } else {
      result = await ApprovalService.hrReview({
        requestId: id,
        actorId,
        actorName,
        approved: false,
        remarks: body.remarks,
      });
    }

    return NextResponse.json({ success: true, request: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Rejection action failed" }, { status: 400 });
  }
}
