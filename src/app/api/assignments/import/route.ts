import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { assignments } = body as { assignments: Array<Record<string, string>> };

  const adminId = (session.user as Record<string, unknown>).id as string;
  const errors: string[] = [];
  let imported = 0;

  for (const row of assignments) {
    const militaryId = row.militaryId || row.military_id || row["Military ID"];
    const actiqAmount = parseInt(row.actiqAmount || row.actiq_amount || row["Actiqs"] || "0") || 0;
    const otherDrugsText = row.otherDrugsText || row.other_drugs || row["Other Drugs"] || null;

    if (!militaryId) {
      errors.push(`Row missing Military ID: ${JSON.stringify(row)}`);
      continue;
    }

    const soldier = await prisma.user.findUnique({ where: { militaryId: String(militaryId) } });
    if (!soldier) {
      errors.push(`Soldier with Military ID ${militaryId} not found`);
      continue;
    }

    try {
      const existing = await prisma.activeAssignment.findUnique({ where: { soldierId: soldier.id } });

      if (existing) {
        await prisma.activeAssignment.update({
          where: { soldierId: soldier.id },
          data: {
            actiqBalance: actiqAmount,
            otherDrugsText: otherDrugsText || existing.otherDrugsText,
            lastAssignedDate: new Date(),
            lastAssignedBy: adminId,
          },
        });
      } else {
        await prisma.activeAssignment.create({
          data: {
            soldierId: soldier.id,
            actiqBalance: actiqAmount,
            otherDrugsText: otherDrugsText || null,
            lastAssignedDate: new Date(),
            lastAssignedBy: adminId,
          },
        });
      }
      imported++;
    } catch (e) {
      errors.push(`Failed to import ${militaryId}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ imported, errors });
}
