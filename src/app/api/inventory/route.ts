import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const batches = await prisma.inventoryBatch.findMany({
    include: { receivingAdmin: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { batches } = await req.json();

  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return NextResponse.json({ error: "No batches provided" }, { status: 400 });
  }

  const adminId = (session.user as Record<string, unknown>).id as string;
  const results = [];

  for (const batch of batches) {
    const record = await prisma.inventoryBatch.create({
      data: {
        drugCategory: "Actiq",
        amountReceived: batch.amount ? parseInt(batch.amount) : 0,
        dateReceived: new Date(batch.dateReceived),
        receivingAdminId: batch.receivingUserId,
        lotNumber: batch.lotNumber || null,
        expirationDate: batch.expirationDate ? new Date(batch.expirationDate) : null,
        otherDrugsNotes: batch.otherDrugsNotes?.trim() || null,
      },
    });

    await prisma.actionLog.create({
      data: {
        actionType: "Received",
        actiqAmount: record.amountReceived,
        otherDrugsText: record.otherDrugsNotes,
        adminId,
        soldierId: batch.receivingUserId,
      },
    });

    results.push(record);
  }

  return NextResponse.json(results, { status: 201 });
}
