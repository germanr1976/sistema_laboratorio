"use client"

import { useEffect, useState } from "react";
import { Sidebar } from "../../componentes/SidebarNew";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [canAccess, setCanAccess] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userType = (localStorage.getItem("userType") || "").toLowerCase();

        let role = "";
        try {
            const rawUser = localStorage.getItem("userData");
            const parsedUser = rawUser ? JSON.parse(rawUser) : null;
            role = String(parsedUser?.role || "").toUpperCase();
        } catch {
            role = "";
        }

        const isProfessionalRole = role === "BIOCHEMIST" || role === "ADMIN";
        const isPatientRole = role === "PATIENT";
        const isProfessionalType = userType === "professional";
        const isPatientType = userType === "patient";

        if (!token) {
            router.replace("/login-profesional");
            return;
        }

        if (isPatientRole || isPatientType) {
            router.replace("/paciente/dashboard");
            return;
        }

        if (!isProfessionalRole && !isProfessionalType) {
            router.replace("/");
            return;
        }

        // Segmentar rutas por rol dentro del área protegida.
        // ADMIN (tenant) solo debe usar el módulo de administración.
        if (role === "ADMIN" && !pathname.startsWith("/tenant-admin")) {
            router.replace("/tenant-admin");
            return;
        }

        // BIOCHEMIST no debe ingresar al módulo de administración del tenant.
        if (role === "BIOCHEMIST" && pathname.startsWith("/tenant-admin")) {
            router.replace("/dashboard");
            return;
        }

        setCanAccess(true);
    }, [router, pathname]);

    if (!canAccess) {
        return null;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
