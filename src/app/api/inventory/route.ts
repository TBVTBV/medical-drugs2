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

  const body = await req.json();
  const { batches, otherDrugsNotes } = body;

  const results = [];

  // Handle Actiq batches
  if (batches && Array.isArray(batches)) {
    for (const batch of batches) {
      const result = await prisma.inventoryBatch.create({
        data: {
          drugCategory: "Actiq",
          amountReceived: parseInt(batch.amount),
          dateReceived: new Date(batch.dateReceived),
          receivingAdminId: batch.receivingUserId,
          lotNumber: batch.lotNumber || null,
          expirationDate: batch.expirationDate ? new Date(batch.expirationDate) : null,
        },
      });
      results.push(result);
    }
  }

  // Handle other drugs notes
  if (otherDrugsNotes) {
    const adminId = (session.user as Record<string, unknown>).id as string;
    const result = await prisma.inventoryBatch.create({
      data: {
        drugCategory: "Other",
        amountReceived: 0,
        dateReceived: new Date(),
        receivingAdminId: adminId,
        otherDrugsNotes,
      },
    });
    results.push(result);
  }

  return NextResponse.json(results, { status: 201 });
}
