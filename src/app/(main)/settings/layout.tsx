import { requireAuth } from "@/lib/userAuth";
import React from "react";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/settings");
  return <>{children}</>;
}
