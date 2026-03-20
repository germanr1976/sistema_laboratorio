"use client";

import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken } from '../utils/authFetch';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = Boolean(getAuthToken());

    const normalizedPath = pathname
        ? pathname === '/'
            ? '/'
            : pathname.replace(/\/+$/, '')
        : '';

    const visibleRoutes = new Set([
        '/',
        '/login-paciente',
        '/login-profesional',
        '/platform/login',
    ]);
    const shouldShowNavbar = visibleRoutes.has(normalizedPath);

    if (!shouldShowNavbar) {
        return null;
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-20 bg-transparent">
            <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo_lab.png"
                        alt="Icono laboratorio"
                        onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='90' viewBox='0 0 180 90'%3E%3Crect x='2' y='2' width='176' height='86' rx='14' fill='%23ffffff' stroke='%233b82f6' stroke-width='4'/%3E%3Ctext x='90' y='54' text-anchor='middle' font-size='34' font-family='Arial' fill='%233b82f6'%3ELAB%3C/text%3E%3C/svg%3E";
                        }}
                        className="h-16 w-28 sm:h-24 sm:w-44 md:h-32 md:w-56 object-cover object-center rounded-xl border-2 border-blue-300 bg-white cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => router.push('/')}
                    />
                    {isAuthenticated && (
                        <span className="text-white font-semibold text-lg hidden sm:block">
                            Sistema de Laboratorio
                        </span>
                    )}
                </div>

                {/* Navigation Links */}
            </div>
        </nav>
    );
}