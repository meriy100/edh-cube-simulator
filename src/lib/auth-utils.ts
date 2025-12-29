import NextAuth from "next-auth";
import { config } from "./auth";
import { NextRequest } from "next/server";

// Initialize auth with our config
const { auth } = NextAuth(config);
export const getAuth = () => auth;

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return await getAuth()();
}

/**
 * Check if user is authenticated admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getSession();

  if (!session?.user?.email) {
    return false;
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim().toLowerCase()) || [];
  const userEmail = session.user.email.toLowerCase().trim();

  return adminEmails.includes(userEmail);
}

/**
 * Check if user is authenticated admin for middleware
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function isAdminAuthenticatedForRequest(_request: NextRequest): Promise<boolean> {
  try {
    const session = await getAuth()();

    if (!session?.user?.email) {
      return false;
    }

    const adminEmails =
      process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim().toLowerCase()) || [];
    const userEmail = session.user.email.toLowerCase().trim();

    return adminEmails.includes(userEmail);
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}

/**
 * Get current admin user info
 */
export async function getAdminUser() {
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim().toLowerCase()) || [];
  const userEmail = session.user.email.toLowerCase().trim();

  if (!adminEmails.includes(userEmail)) {
    return null;
  }

  return {
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

/**
 * Require admin authentication - throws if not authenticated
 */
export async function requireAdmin() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    throw new Error("Admin authentication required");
  }

  return await getSession();
}
