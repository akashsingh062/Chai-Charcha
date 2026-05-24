import { requireAuth } from "@/lib/userAuth";
import React from "react";

export default async function PostLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/post");
  return <>{children}</>;
}
