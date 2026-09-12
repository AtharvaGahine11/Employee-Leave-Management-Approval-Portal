import { NextRequest, NextResponse } from "next/server";
import { CronService } from "@/lib/server/services/cron.service";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "elap_cron_secure_token_2026";

  // Security Check: Bearer token or Vercel cron header
  if (
    authHeader !== `Bearer ${cronSecret}` &&
    request.headers.get("x-vercel-cron") !== "1" &&
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.json({ error: "Unauthorized cron execution request." }, { status: 401 });
  }

  const result = await CronService.processPendingRemindersAndEscalations();

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
