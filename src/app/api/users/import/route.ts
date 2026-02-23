import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { users } = body as { users: Array<Record<string, string>> };

  const errors: string[] = [];
  let imported = 0;

  for (const row of users) {
    const militaryId = row.militaryId || row.military_id || row["Military ID"];
    const fullName = row.fullName || row.full_name || row["Full Name"];
    const rank = row.rank || row.Rank;
    const job = row.job || row.Job;
    const phoneNumber = row.phoneNumber || row.phone_number || row["Phone Number"];
    const systemRole = row.systemRole || row.system_role || row["System Role"] || "General";
    const email = row.email || row.Email || "";

    if (!militaryId || !fullName || !rank || !job || !phoneNumber) {
      errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
      continue;
    }

    const existing = await prisma.user.findUnique({
      where: { militaryId: String(militaryId) },
    });

    if (existing) {
      errors.push(`Military ID ${militaryId} already exists (${existing.fullName})`);
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          militaryId: String(militaryId),
          fullName: String(fullName).trim(),
          rank: String(rank),
          job: String(job),
          phoneNumber: String(phoneNumber).replace(/\D/g, ""),
          systemRole: String(systemRole),
          email: email || null,
        },
      });
      imported++;
    } catch (e) {
      errors.push(`Failed to import ${fullName}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ imported, errors });
}
