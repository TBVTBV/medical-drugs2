import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Total Actiqs received
  const totalReceived = await prisma.inventoryBatch.aggregate({
    _sum: { amountReceived: true },
    where: { drugCategory: "Actiq" },
  });

  // Currently assigned
  const totalAssigned = await prisma.activeAssignment.aggregate({
    _sum: { actiqBalance: true },
  });

  // Administered + Lost (deducted permanently)
  const permanentlyUsed = await prisma.actionLog.aggregate({
    _sum: { actiqAmount: true },
    where: {
      actionType: { in: ["Administered", "Lost/Damaged"] },
    },
  });

  const totalActiqs = totalReceived._sum.amountReceived || 0;
  const assignedActiqs = totalAssigned._sum.actiqBalance || 0;
  const usedActiqs = permanentlyUsed._sum.actiqAmount || 0;
  const availableActiqs = totalActiqs - assignedActiqs - usedActiqs;

  // Role distribution for soldiers with actiq assignments
  const actiqAssignments = await prisma.activeAssignment.findMany({
    where: { actiqBalance: { gt: 0 } },
    include: { soldier: true },
  });

  const roleDistribution: Record<string, { count: number; totalActiqs: number }> = {};
  for (const a of actiqAssignments) {
    const job = a.soldier.job;
    if (!roleDistribution[job]) {
      roleDistribution[job] = { count: 0, totalActiqs: 0 };
    }
    roleDistribution[job].count++;
    roleDistribution[job].totalActiqs += a.actiqBalance;
  }

  // Role distribution for soldiers with other drugs
  const otherDrugAssignments = await prisma.activeAssignment.findMany({
    where: { otherDrugsText: { not: null } },
    include: { soldier: true },
  });

  const otherDrugsRoleDistribution: Record<string, number> = {};
  for (const a of otherDrugAssignments) {
    const job = a.soldier.job;
    otherDrugsRoleDistribution[job] = (otherDrugsRoleDistribution[job] || 0) + 1;
  }

  return NextResponse.json({
    totalActiqs,
    assignedActiqs,
    availableActiqs,
    usedActiqs,
    roleDistribution,
    otherDrugsRoleDistribution,
  });
}
