import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  avatar?: string;
}

/**
 * Server-side admin authorization guard.
 * Call this at the top of every admin API route and server component.
 * Throws a structured error object if the user is not authenticated or not an admin.
 */
export async function requireAdmin(): Promise<{ user: AdminUser }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw { status: 401, message: "Unauthorized — no active session" };
  }

  await connectDB();

  const dbUser = await User.findById(session.user.id).select(
    "name email role username avatar isBanned"
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found in database" };
  }

  if (dbUser.isBanned) {
    throw { status: 403, message: "Account is banned" };
  }

  if (dbUser.role !== "admin") {
    throw { status: 403, message: "Forbidden — admin access required" };
  }

  return {
    user: {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      username: dbUser.username,
      avatar: dbUser.avatar,
    },
  };
}

/**
 * Helper to create a JSON error response from requireAdmin() exceptions
 */
export function adminErrorResponse(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "message" in error
  ) {
    const e = error as { status: number; message: string };
    return Response.json({ error: e.message }, { status: e.status });
  }
  const message =
    error instanceof Error ? error.message : "Internal Server Error";
  return Response.json({ error: message }, { status: 500 });
}
