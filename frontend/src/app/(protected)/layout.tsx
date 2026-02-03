"use client"

import { Sidebar } from "../../componentes/SidebarNew";
import { useAuth } from "../../utils/useAuth";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
