import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide both username and password." },
        { status: 400 }
      );
    }

    const isValid = verifyCredentials(username.trim(), password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password. Please try again." },
        { status: 401 }
      );
    }

    const token = createSessionToken(username.trim());
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful.",
      username: username.trim(),
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
