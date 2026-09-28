import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SESSION_COOKIE_NAME = "wedding_admin_session";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "kevin_vora_wedding_secret_key_2026_luxury_edition";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "wedding2026";

export interface SessionPayload {
  username: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

export function verifyCredentials(user: string, pass: string): boolean {
  return user === ADMIN_USERNAME && pass === ADMIN_PASSWORD;
}

export function createSessionToken(username: string): string {
  return jwt.sign(
    {
      username,
      role: "admin",
    },
    SESSION_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, SESSION_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null && session.role === "admin";
}

export { SESSION_COOKIE_NAME };
