import { requireAuth } from "@/lib/userAuth";
import React from "react";

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/notifications");
  return <>{children}</>;
}
