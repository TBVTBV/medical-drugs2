import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.actionLog.findMany({
    include: {
      admin: true,
      soldier: true,
    },
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json(logs);
}
