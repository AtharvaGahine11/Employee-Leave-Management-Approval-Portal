import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { dataStore } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");
  const managerId = searchParams.get("managerId");

  try {
    const where: any = { isActive: true };
    if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;
    if (managerId) where.managerId = managerId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        manager: true,
        balances: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    const all = dataStore.getEmployees();
    return NextResponse.json({ success: true, employees: all });
  }
}
