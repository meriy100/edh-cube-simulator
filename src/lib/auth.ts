import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const adminEmails =
  process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim().toLowerCase()) || [];

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login", // Redirect errors to login page
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log(`User signed in: ${user.email}`);
      // Only allow Google OAuth
      if (account?.provider !== "google") {
        return false;
      }

      // Check if user email is in the admin whitelist
      const userEmail = user.email?.toLowerCase().trim();
      if (!userEmail || !adminEmails.includes(userEmail)) {
        console.warn(`Unauthorized login attempt from: ${userEmail}`);
        return false;
      }

      console.log(`Authorized admin login: ${userEmail}`);
      return true;
    },
    async jwt({ token, user }) {
      // Store user info in JWT token
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass user info from JWT to session
      if (token) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};
