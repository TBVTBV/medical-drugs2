import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { militaryId, fullName, rank, job, phoneNumber, systemRole, email, roleExpirationDate } = body;

  // Validate military ID is exactly 7 digits
  if (!/^\d{7}$/.test(militaryId)) {
    return NextResponse.json({ error: "Military ID must be exactly 7 digits" }, { status: 400 });
  }

  // Validate name has at least two words
  if (!fullName || fullName.trim().split(/\s+/).length < 2) {
    return NextResponse.json({ error: "Full name must contain at least two words" }, { status: 400 });
  }

  // Check unique military ID
  const existing = await prisma.user.findUnique({ where: { militaryId } });
  if (existing) {
    return NextResponse.json({ error: `Military ID ${militaryId} already exists` }, { status: 409 });
  }

  // Admin/Temp_Admin requires email
  if ((systemRole === "Admin" || systemRole === "Temp_Admin") && !email) {
    return NextResponse.json({ error: "Email is required for Admin/Temp Admin roles" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      militaryId,
      fullName: fullName.trim(),
      rank,
      job,
      phoneNumber: phoneNumber.replace(/\D/g, ""),
      systemRole: systemRole || "General",
      email: email || null,
      roleExpirationDate: roleExpirationDate ? new Date(roleExpirationDate) : null,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
