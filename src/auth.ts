import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const identifier = (credentials.email as string).trim();
        console.log("[AUTH] Authorizing user:", identifier);

        const user = await prisma.user.findFirst({
          where: { 
            OR: [
              { email: identifier },
              { name: identifier }
            ]
          }
        });
        
        if (!user) {
          console.log("[AUTH] User not found for identifier:", identifier);
          return null;
        }

        if (!user.password) {
          console.log("[AUTH] User found but has no password");
          return null;
        }
        
        const isMatch = await bcrypt.compare(credentials.password as string, user.password);
        if (!isMatch) {
          console.log("[AUTH] Password mismatch for user:", identifier);
          return null;
        }
        
        console.log("[AUTH] Login successful for:", identifier);
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // User object from authorize has orgId because Prisma returns it
        token.orgId = (user as any).orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).orgId = token.orgId as string | undefined;
      }
      return session;
    }
  }
});
