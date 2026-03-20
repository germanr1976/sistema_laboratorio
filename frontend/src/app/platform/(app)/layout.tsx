"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, BarChart3, LogOut, ClipboardList } from 'lucide-react';
import { useEffect } from 'react';
import { clearPlatformSession } from '../../../utils/platformAuth';

function getPlatformAppAccess() {
    if (typeof window === 'undefined') {
        return { canAccess: false, redirectTo: null as string | null };
    }

    const token = localStorage.getItem('platformAuthToken');
    const rawUser = localStorage.getItem('platformUserData');

    if (!token || !rawUser) {
        return { canAccess: false, redirectTo: '/platform/login' as string | null };
    }

    try {
        const user = JSON.parse(rawUser);
        const role = String(user?.role || '').toUpperCase();
        const hasPlatformAccess = role === 'PLATFORM_ADMIN' || Boolean(user?.isPlatformAdmin);

        if (!hasPlatformAccess) {
            return { canAccess: false, redirectTo: '/platform/login' as string | null };
        }

        return { canAccess: true, redirectTo: null as string | null };
    } catch {
        return { canAccess: false, redirectTo: '/platform/login' as string | null };
    }
}

export default function PlatformAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const access = getPlatformAppAccess();

    useEffect(() => {
        if (access.redirectTo) {
            router.replace(access.redirectTo);
        }
    }, [access.redirectTo, router]);

    if (!access.canAccess) {
        return null;
    }

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <aside className="w-72 bg-slate-900 text-white flex flex-col h-screen sticky top-0 overflow-y-auto">
                <div className="px-6 py-5 border-b border-slate-800">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Portal Empresa</p>
                    <h1 className="text-lg font-semibold mt-1">Admin Plataforma</h1>
                </div>

                <nav className="p-4 space-y-2 flex-1">
                    <Link
                        href="/platform/tenants"
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${isActive('/platform/tenants') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Tenants y Planes
                    </Link>
                    <Link
                        href="/platform/metricas"
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${isActive('/platform/metricas') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Métricas Globales
                    </Link>
                    <Link
                        href="/platform/auditoria"
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${isActive('/platform/auditoria') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Auditoría Global
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-red-600 hover:bg-red-700 px-3 py-2 text-sm font-medium"
                        onClick={() => {
                            clearPlatformSession();
                            router.push('/platform/login');
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 h-screen overflow-y-auto">{children}</main>
        </div>
    );
}
