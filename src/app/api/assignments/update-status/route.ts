import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { soldierId, actionType, actiqAmount, otherDrugsText, signatureData } = body;
  const adminId = (session.user as Record<string, unknown>).id as string;

  const actiqCount = parseInt(actiqAmount) || 0;

  // Get current assignment
  const assignment = await prisma.activeAssignment.findUnique({
    where: { soldierId },
  });

  if (!assignment) {
    return NextResponse.json({ error: "No active assignment found for this soldier" }, { status: 404 });
  }

  // Validate actiq amount
  if (actiqCount > assignment.actiqBalance) {
    return NextResponse.json({ error: "Cannot process more Actiqs than currently assigned" }, { status: 400 });
  }

  // Save signature if provided (required for Returns)
  let signatureUrl: string | null = null;
  if (signatureData) {
    const sigDir = path.join(process.cwd(), "public", "signatures");
    await mkdir(sigDir, { recursive: true });
    const filename = `sig_${Date.now()}_${soldierId}_${actionType}.png`;
    const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
    await writeFile(path.join(sigDir, filename), Buffer.from(base64Data, "base64"));
    signatureUrl = `/signatures/${filename}`;
  }

  // Update active assignment
  const newBalance = assignment.actiqBalance - actiqCount;

  // Handle other drugs text removal
  let newOtherDrugs = assignment.otherDrugsText;
  if (otherDrugsText && actionType !== "Given") {
    // Remove the specific other drugs text if it matches
    newOtherDrugs = null;
  }

  if (newBalance <= 0 && !newOtherDrugs) {
    // Remove assignment entirely
    await prisma.activeAssignment.delete({ where: { soldierId } });
  } else {
    await prisma.activeAssignment.update({
      where: { soldierId },
      data: {
        actiqBalance: newBalance,
        otherDrugsText: newOtherDrugs,
      },
    });
  }

  // If returned, add back to inventory (we track via the log, dashboard calculates from it)
  // The dashboard math: Available = Total received - currently assigned - administered - lost
  // So for "Returned", we only deduct from active_assignments (already done above)
  // For "Administered" and "Lost/Damaged", we also deduct (already done above) and log it

  // Create action log
  await prisma.actionLog.create({
    data: {
      actionType,
      actiqAmount: actiqCount,
      otherDrugsText: otherDrugsText || null,
      adminId,
      soldierId,
      signatureImageUrl: signatureUrl,
    },
  });

  return NextResponse.json({ success: true });
}
