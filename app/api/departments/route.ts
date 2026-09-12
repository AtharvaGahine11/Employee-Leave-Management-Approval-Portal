import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { dataStore } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, departments });
  } catch (error) {
    const all = dataStore.getDepartments();
    return NextResponse.json({ success: true, departments: all });
  }
}
