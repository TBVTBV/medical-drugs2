import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignments = await prisma.activeAssignment.findMany({
    include: {
      soldier: true,
      assignedBy: true,
    },
    orderBy: { lastAssignedDate: "desc" },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { soldierId, actiqAmount, otherDrugsText, signatureData } = body;
  const adminId = (session.user as Record<string, unknown>).id as string;

  // Save signature image
  let signatureUrl: string | null = null;
  if (signatureData) {
    const sigDir = path.join(process.cwd(), "public", "signatures");
    await mkdir(sigDir, { recursive: true });
    const filename = `sig_${Date.now()}_${soldierId}.png`;
    const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
    await writeFile(path.join(sigDir, filename), Buffer.from(base64Data, "base64"));
    signatureUrl = `/signatures/${filename}`;
  }

  // Upsert active assignment
  const existing = await prisma.activeAssignment.findUnique({
    where: { soldierId },
  });

  const actiqCount = parseInt(actiqAmount) || 0;

  if (existing) {
    // Merge: add Actiqs, append other drugs text
    const newOtherDrugs = otherDrugsText
      ? existing.otherDrugsText
        ? `${existing.otherDrugsText}\n${otherDrugsText}`
        : otherDrugsText
      : existing.otherDrugsText;

    await prisma.activeAssignment.update({
      where: { soldierId },
      data: {
        actiqBalance: existing.actiqBalance + actiqCount,
        otherDrugsText: newOtherDrugs,
        lastAssignedDate: new Date(),
        lastAssignedBy: adminId,
      },
    });
  } else {
    await prisma.activeAssignment.create({
      data: {
        soldierId,
        actiqBalance: actiqCount,
        otherDrugsText: otherDrugsText || null,
        lastAssignedDate: new Date(),
        lastAssignedBy: adminId,
      },
    });
  }

  // Log the action
  await prisma.actionLog.create({
    data: {
      actionType: "Given",
      actiqAmount: actiqCount,
      otherDrugsText: otherDrugsText || null,
      adminId,
      soldierId,
      signatureImageUrl: signatureUrl,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
