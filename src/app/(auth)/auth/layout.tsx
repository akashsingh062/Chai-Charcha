import { auth } from "@/lib/auth";
import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const session = await auth.api.getSession({headers:await headers()})

  if (session) {
    redirect("/");
  }

  return <>{children}</>;
}
