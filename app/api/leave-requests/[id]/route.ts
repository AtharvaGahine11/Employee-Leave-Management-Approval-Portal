import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { dataStore } from "@/lib/data/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true, manager: true } },
        manager: true,
        hr: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
        auditLogs: {
          include: { actor: true },
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!leaveRequest) {
      // Prototype fallback
      const all = dataStore.getLeaveRequests();
      const mockReq = all.find((r) => r.id === id || r.requestId === id);
      if (mockReq) return NextResponse.json({ success: true, request: mockReq });
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: leaveRequest });
  } catch (error) {
    const all = dataStore.getLeaveRequests();
    const mockReq = all.find((r) => r.id === id || r.requestId === id);
    if (mockReq) return NextResponse.json({ success: true, request: mockReq });
    return NextResponse.json({ error: "Failed to fetch leave request" }, { status: 500 });
  }
}
