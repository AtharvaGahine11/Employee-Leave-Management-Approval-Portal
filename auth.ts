import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { DEMO_USERS } from "@/lib/auth/auth-service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        try {
          // 1. Try DB lookup via Prisma Client
          const user = await prisma.user.findUnique({
            where: { email },
            include: { employee: { include: { department: true } } },
          });

          if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (isPasswordValid && user.employee && user.employee.isActive) {
              return {
                id: user.employee.id,
                userId: user.id,
                email: user.email,
                role: user.role,
                employeeId: user.employee.employeeId,
                name: user.employee.name,
                department: user.employee.department.name,
                designation: user.employee.designation,
              };
            }
          }
        } catch (error) {
          // DB error fallback during development
        }

        // 2. Demo fallback authentication
        const demo = DEMO_USERS[email];
        if (demo && demo.password === password) {
          return {
            id: demo.session.id,
            userId: demo.session.id,
            email: demo.session.email,
            role: demo.session.role,
            employeeId: demo.session.employeeId,
            name: demo.session.name,
            department: demo.session.department,
            designation: demo.session.designation,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes session expiration
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
        token.name = user.name;
        token.department = (user as any).department;
        token.designation = (user as any).designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).name = token.name;
        (session.user as any).department = token.department;
        (session.user as any).designation = token.designation;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET || "elap_production_super_secret_jwt_key_2026_change_me",
});
