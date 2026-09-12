import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { LeaveService } from "@/lib/server/services/leave.service";
import { CreateLeaveSchema } from "@/lib/server/validators/leave.schema";
import { prisma } from "@/lib/server/prisma";
import { dataStore } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const leaveType = searchParams.get("leaveType");
  const departmentId = searchParams.get("departmentId");
  const employeeId = searchParams.get("employeeId");
  const search = searchParams.get("search");

  const userRole = (session.user as any).role;
  const currentEmpId = (session.user as any).id;

  try {
    const whereClause: any = {};

    // RBAC filtering
    if (userRole === "EMPLOYEE") {
      whereClause.employeeId = currentEmpId;
    } else if (userRole === "MANAGER") {
      // Managers view requests assigned to them or their direct reports
      whereClause.OR = [
        { managerId: currentEmpId },
        { employee: { managerId: currentEmpId } },
      ];
    }
    // HR can view all requests across all 8 departments

    if (status && status !== "ALL") whereClause.status = status;
    if (leaveType && leaveType !== "ALL") whereClause.leaveType = leaveType;
    if (departmentId && departmentId !== "ALL") whereClause.employee = { departmentId };
    if (employeeId) whereClause.employeeId = employeeId;
    if (search) {
      whereClause.OR = [
        { requestId: { contains: search, mode: "insensitive" } },
        { employee: { name: { contains: search, mode: "insensitive" } } },
        { employee: { employeeId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: { include: { department: true } },
        manager: true,
        hr: true,
        attachments: true,
        comments: { include: { author: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    // Prototype fallback
    const all = dataStore.getLeaveRequests();
    return NextResponse.json({ success: true, requests: all });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can submit leave applications." }, { status: 403 });
  }

  const employeeId = (session.user as any).id;

  try {
    const body = await request.json();
    const validation = CreateLeaveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const leaveRequest = await LeaveService.createLeaveRequest(employeeId, validation.data);

    return NextResponse.json({ success: true, request: leaveRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit leave request" },
      { status: 400 }
    );
  }
}
