import { prisma } from "@/lib/db";
import { compare } from "bcrypt";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Look for the user by email
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        // If no user was found or password is null
        if (!user || !user.password) {
          return null;
        }

        // Compare password
        const passwordMatch = await compare(
          credentials.password,
          user.password
        );
        if (!passwordMatch) {
          return null;
        }

        // Return the user object without sensitive data
        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Pass user data to the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass token data to the session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
