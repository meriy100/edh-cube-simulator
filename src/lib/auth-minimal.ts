import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// テスト用最小構成
export const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "test",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "test",
    }),
  ],
  debug: true,
};