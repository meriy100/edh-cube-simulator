import NextAuth from "next-auth";
import { config } from "@/lib/auth";

const { handlers } = NextAuth(config);

export const { GET, POST } = handlers;
