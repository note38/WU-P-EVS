import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

// Extend types for NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
    email?: string | null;
    role: string;
    userType: string;
    status?: string;
    electionId?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      userType: string;
      status?: string;
      electionId?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    userType: string;
    status?: string;
    electionId?: number;
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 5 * 60 * 60, // 5 hours in seconds
  },
  callbacks: {
    // Optimize token handling by only adding essential data
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.userType = user.userType;
        // Pass any additional voter properties if available
        if (user.status) token.status = user.status;
        if (user.electionId) token.electionId = user.electionId;
      }
      return token;
    },
    // Keep session handling lean
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.userType = token.userType;
        // Pass any additional voter properties if available
        if (token.status) session.user.status = token.status;
        if (token.electionId) session.user.electionId = token.electionId;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // First, try to authenticate as admin
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              username: true,
              password: true,
              role: true,
            },
            cacheStrategy: { ttl: 600 }, // Cache for 10 minutes
          });

          if (user && user.password) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (isValidPassword) {
              // Return admin user object
              return {
                id: user.id.toString(),
                name: user.username,
                email: user.email,
                role: user.role.toString(),
                userType: "admin",
              };
            }
          }

          // If admin authentication failed, try voter authentication
          const voter = await prisma.voter.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              hashpassword: true,
              role: true,
              electionId: true,
              status: true,
            },
            cacheStrategy: { ttl: 600 }, // Cache for 10 minutes
          });

          if (voter && voter.hashpassword) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              voter.hashpassword
            );

            if (isValidPassword) {
              // Check if there's an active election
              if (voter.electionId) {
                const activeElection = await prisma.election.findFirst({
                  where: {
                    id: voter.electionId,
                    status: "ACTIVE",
                  },
                  select: { id: true },
                  cacheStrategy: { ttl: 60 }, // Cache for 1 minute
                });

                // If the voter has already voted, prevent login
                if (voter.status === "VOTED") {
                  throw new Error("You have already cast your vote");
                }

                // If there's no active election, prevent voter login
                if (!activeElection) {
                  throw new Error("No active election available for voting");
                }
              } else {
                throw new Error("Voter not associated with any election");
              }

              // Return voter user object
              return {
                id: voter.id.toString(),
                name: `${voter.firstName} ${voter.lastName}`,
                email: voter.email,
                role: voter.role.toString(),
                userType: "voter",
                status: voter.status,
                electionId: voter.electionId,
              };
            }
          }

          // If both admin and voter authentication failed, return null
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          throw error; // Propagate error for better client-side handling
        }
      },
    }),
  ],
};
