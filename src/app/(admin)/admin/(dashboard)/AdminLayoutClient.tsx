"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-black text-floral-white flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Topbar */}
        <AdminTopbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 bg-ink-black/20 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
