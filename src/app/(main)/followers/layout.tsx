import { requireAuth } from "@/lib/userAuth";
import React from "react";

export default async function FollowersLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/followers");
  return <>{children}</>;
}
