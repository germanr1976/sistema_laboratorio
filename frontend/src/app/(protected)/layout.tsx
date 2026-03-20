"use client"

import { useEffect, useState } from "react";
import { Sidebar } from "../../componentes/SidebarNew";
import { usePathname, useRouter } from "next/navigation";

function getProtectedRouteAccess(pathname: string) {
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
        return { canAccess: false, redirectTo: "/login-profesional" };
    }

    if (isPatientRole || isPatientType) {
        return { canAccess: false, redirectTo: "/paciente/dashboard" };
    }

    if (!isProfessionalRole && !isProfessionalType) {
        return { canAccess: false, redirectTo: "/" };
    }

    // Segmentar rutas por rol dentro del área protegida.
    // ADMIN (tenant) solo debe usar el módulo de administración.
    if (role === "ADMIN" && !pathname.startsWith("/tenant-admin")) {
        return { canAccess: false, redirectTo: "/tenant-admin" };
    }

    // BIOCHEMIST no debe ingresar al módulo de administración del tenant.
    if (role === "BIOCHEMIST" && pathname.startsWith("/tenant-admin")) {
        return { canAccess: false, redirectTo: "/dashboard" };
    }

    return { canAccess: true, redirectTo: null as string | null };
}

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [access, setAccess] = useState<{ canAccess: boolean; redirectTo: string | null; checked: boolean }>({
        canAccess: false,
        redirectTo: null,
        checked: false,
    });

    useEffect(() => {
        const result = getProtectedRouteAccess(pathname);
        setAccess({ ...result, checked: true });
    }, [pathname]);

    useEffect(() => {
        if (access.redirectTo) {
            router.replace(access.redirectTo);
        }
    }, [access.redirectTo, router]);

    // Mantener primera render igual entre SSR e hidratación para evitar mismatch.
    if (!access.checked || !access.canAccess) {
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
