import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { AddCommentSchema } from "@/lib/server/validators/approval.schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await prisma.leaveComment.findMany({
      where: { leaveRequestId: params.id },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    return NextResponse.json({ success: true, comments: [] });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authorId = (session.user as any).id;
  const authorRole = (session.user as any).role;

  try {
    const body = await request.json();
    const validation = AddCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
    }

    const comment = await prisma.leaveComment.create({
      data: {
        leaveRequestId: params.id,
        authorId,
        authorRole,
        comment: validation.data.comment,
      },
      include: { author: true },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add comment" }, { status: 400 });
  }
}
