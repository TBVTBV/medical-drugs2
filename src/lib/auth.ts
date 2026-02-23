import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma as never),
  logger: {
    error(error) {
      console.error("[auth][detailed-error]", error);
      if (error instanceof Error && error.cause) {
        console.error("[auth][error-cause]", error.cause);
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Check if a user record with this email exists
        const existingUser = await prisma.user.findFirst({
          where: { email: user.email },
        });

        if (existingUser) {
          // User exists - allow sign in
          return true;
        }

        // Check if any users exist at all (first user becomes admin)
        const userCount = await prisma.user.count();

        if (userCount === 0) {
          // First user - auto-create as Admin
          await prisma.user.create({
            data: {
              militaryId: "0000000",
              fullName: user.name || "Admin",
              rank: "Seren",
              job: "Logistical",
              phoneNumber: "0500000000",
              systemRole: "Admin",
              email: user.email,
            },
          });
          return true;
        }

        // No matching user record and not first user - deny
        return false;
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: session.user.email },
        });
        if (dbUser) {
          // Check if Temp Admin has expired
          if (
            dbUser.systemRole === "Temp_Admin" &&
            dbUser.roleExpirationDate &&
            new Date() > new Date(dbUser.roleExpirationDate)
          ) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { systemRole: "General", roleExpirationDate: null },
            });
            dbUser.systemRole = "General";
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = session.user as any;
          u.id = dbUser.id;
          u.systemRole = dbUser.systemRole;
          u.militaryId = dbUser.militaryId;
          u.fullName = dbUser.fullName;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
