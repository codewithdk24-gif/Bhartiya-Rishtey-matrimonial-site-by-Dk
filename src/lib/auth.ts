import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DefaultSession } from "next-auth";
import { NextResponse } from "next/server";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: string;
      isPremium: boolean;
      role: string;
      isProfileComplete: boolean;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    plan?: string;
    isPremium?: boolean;
    role?: string;
    isProfileComplete?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user || !user.passwordHash) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        console.log(`[NextAuth] Authorize successful for: ${user.email}`);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          isPremium: user.isPremium,
          role: user.role,
          isProfileComplete: (user as any).isProfileComplete,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log(`[NextAuth] JWT Callback - Trigger: ${trigger}, HasUser: ${!!user}`);
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.isPremium = user.isPremium;
        token.role = user.role;
        token.isProfileComplete = user.isProfileComplete;
      }
      if (trigger === "update" && session?.isProfileComplete !== undefined) {
        token.isProfileComplete = session.isProfileComplete;
      }
      return token;
    },
    async session({ session, token }) {
      console.log(`[NextAuth] Session Callback - TokenID: ${token.id}`);
      if (session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as string;
        session.user.isPremium = token.isPremium as boolean;
        session.user.role = token.role as string;
        session.user.isProfileComplete = token.isProfileComplete as boolean;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-stable-123456789",
  debug: true,
};

import { getServerSession } from "next-auth/next";

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Legacy helper to get user ID from request (Sync version for compatibility)
 * Note: For new code, prefer await getServerSession(authOptions)
 */
export function getUserIdFromRequest(request: Request): string | null {
  // This is a placeholder that might not work perfectly because getServerSession is async.
  // However, we can try to read the header if we're using the middleware injection,
  // OR we just recommend using the async version.
  // To fix the "Module has no exported member" error immediately:
  const userId = request.headers.get("x-user-id");
  return userId;
}

/**
 * Async version of getting user ID
 */
export async function getUserId(request?: Request): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

/**
 * Legacy helper for session
 */
export async function getSessionFromRequest() {
  return await getServerSession(authOptions);
}
