import { requireAdmin } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import React from "react";
import { AdminLayoutClient } from "./AdminLayoutClient";

export const metadata = {
  title: "Admin Panel — Chai Charcha",
  description: "Secure Admin Panel for Chai Charcha community forum",
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isAdmin = false;
  try {
    const { user } = await requireAdmin();
    isAdmin = user.role === "admin";
  } catch (error: unknown) {
    // If unauthorized, redirect to admin login
    if (error && typeof error === "object" && "status" in error && error.status === 401) {
      redirect("/admin/login");
    }
    // If forbidden, redirect to homepage
    redirect("/");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
