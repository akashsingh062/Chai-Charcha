import { requireAuth } from "@/lib/userAuth";
import React from "react";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/messages");
  return <>{children}</>;
}
