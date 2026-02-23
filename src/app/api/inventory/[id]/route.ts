import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminId = (session.user as Record<string, unknown>).id as string;

  const batch = await prisma.inventoryBatch.findUnique({ where: { id: params.id } });
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inventoryBatch.delete({ where: { id: params.id } });

  await prisma.actionLog.create({
    data: {
      actionType: "Shipment Removed",
      actiqAmount: batch.amountReceived,
      otherDrugsText: batch.otherDrugsNotes,
      adminId,
      soldierId: batch.receivingAdminId,
    },
  });

  return NextResponse.json({ success: true });
}
