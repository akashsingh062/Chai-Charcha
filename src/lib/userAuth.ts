import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  avatar?: string;
}

/**
 * Server-side authentication guard for regular user routes.
 * Call this at the top of a server component that requires authentication.
 * If the user is not authenticated, it immediately redirects them to the login page.
 */
export async function requireAuth(returnUrl?: string): Promise<{ user: SessionUser }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    const redirectUrl = returnUrl 
      ? `/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}` 
      : "/auth/signin";
    redirect(redirectUrl);
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as string,
      username: session.user.username as string | undefined,
      avatar: session.user.avatar as string | undefined,
    },
  };
}
