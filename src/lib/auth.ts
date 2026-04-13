import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "ADMIN" | "CLIENT";
        session.user.id = token.userId as string;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === "ADMIN";
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      const isPortalRoute = request.nextUrl.pathname.startsWith("/portal");
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoginPage) {
        if (isLoggedIn) {
          const redirectTo = isAdmin ? "/admin/dashboard" : "/portal/dashboard";
          return Response.redirect(new URL(redirectTo, request.nextUrl));
        }
        return true;
      }

      if (isAdminRoute) {
        if (!isLoggedIn)
          return Response.redirect(new URL("/login", request.nextUrl));
        if (!isAdmin)
          return Response.redirect(
            new URL("/portal/dashboard", request.nextUrl)
          );
        return true;
      }

      if (isPortalRoute) {
        if (!isLoggedIn)
          return Response.redirect(new URL("/login", request.nextUrl));
        return true;
      }

      return true;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
});
