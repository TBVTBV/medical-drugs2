import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { militaryId, fullName, rank, job, phoneNumber, systemRole, email, roleExpirationDate } = body;

  // Check if military ID is being changed and conflicts
  if (militaryId) {
    const existing = await prisma.user.findUnique({ where: { militaryId } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Military ID ${militaryId} already exists` }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(militaryId && { militaryId }),
      ...(fullName && { fullName: fullName.trim() }),
      ...(rank && { rank }),
      ...(job && { job }),
      ...(phoneNumber && { phoneNumber: phoneNumber.replace(/\D/g, "") }),
      ...(systemRole && { systemRole }),
      email: email || null,
      roleExpirationDate: roleExpirationDate ? new Date(roleExpirationDate) : null,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check if soldier has active assignments
  const assignment = await prisma.activeAssignment.findUnique({ where: { soldierId: id } });
  if (assignment && (assignment.actiqBalance > 0 || assignment.otherDrugsText)) {
    return NextResponse.json(
      { error: "Cannot delete user with active drug assignments. Return all drugs first." },
      { status: 400 }
    );
  }

  // Delete related records
  await prisma.activeAssignment.deleteMany({ where: { soldierId: id } });
  await prisma.account.deleteMany({ where: { userId: id } });
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
