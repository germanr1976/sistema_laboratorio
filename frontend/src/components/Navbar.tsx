"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken } from '../utils/authFetch';
import Clock from '../componentes/Clock';

export default function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const isAuthFlow = pathname?.startsWith('/login') || pathname?.startsWith('/registro');

    useEffect(() => {
        const token = getAuthToken();
        setIsAuthenticated(!!token);
    }, [pathname]); // Re-check authentication when route changes

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        setIsAuthenticated(false);
        sessionStorage.setItem('justLoggedOut', 'true'); // ⬅️ AGREGAR ESTA LÍNEA
        router.push('/');
    };

    // No mostrar navbar en rutas con Sidebar
    const hiddenRoutes = ['/dashboard', '/estudios', '/historial', '/configuraciones', '/ayuda', '/cargar-nuevo', '/revision', '/paciente'];
    const shouldHideNavbar = hiddenRoutes.some(route => pathname?.startsWith(route));

    if (shouldHideNavbar) {
        return null;
    }

    return (
        <nav className="absolute top-0 left-0 right-0 z-20 bg-transparent">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src="/logo_lab.png"
                        alt="Icono laboratorio"
                        onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='90' viewBox='0 0 180 90'%3E%3Crect x='2' y='2' width='176' height='86' rx='14' fill='%23ffffff' stroke='%233b82f6' stroke-width='4'/%3E%3Ctext x='90' y='54' text-anchor='middle' font-size='34' font-family='Arial' fill='%233b82f6'%3ELAB%3C/text%3E%3C/svg%3E";
                        }}
                        className="h-32 w-56 object-cover object-center rounded-xl border-2 border-blue-300 bg-white cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => router.push('/')}
                    />
                    {isAuthenticated && (
                        <span className="text-white font-semibold text-lg hidden sm:block">
                            Sistema de Laboratorio
                        </span>
                    )}
                </div>

                {/* Navigation Links */}
                {isAuthenticated && !isAuthFlow && (
                    <div className="flex items-center gap-6">
                        <Clock boxBg="bg-white/90" boxBorder="border-blue-200" iconColor="text-blue-600" showDate={true} showIcon={true} />
                        <button
                            onClick={() => router.push('/dashboard')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${pathname === '/dashboard'
                                ? 'bg-white text-blue-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                        >
                            Salir
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}