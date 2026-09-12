import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { LeaveService } from "@/lib/server/services/leave.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const actorId = (session.user as any).id;

  try {
    const updated = await LeaveService.cancelLeaveRequest(id, actorId);
    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Cancellation failed" }, { status: 400 });
  }
}
