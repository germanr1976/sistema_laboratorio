"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken } from '@/utils/authFetch';

export default function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = getAuthToken();
        setIsAuthenticated(!!token);
    }, [pathname]); // Re-check authentication when route changes

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        setIsAuthenticated(false);
        router.push('/');
    };

    // No mostrar navbar en rutas con Sidebar
    const hiddenRoutes = ['/dashboard', '/estudios', '/historial', '/configuraciones', '/ayuda', '/cargar-nuevo', '/revision'];
    const shouldHideNavbar = hiddenRoutes.some(route => pathname?.startsWith(route));

    if (shouldHideNavbar) {
        return null;
    }

    return (
        <nav className="absolute top-0 left-0 right-0 z-20 bg-transparent">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-4">
                    <img
                        src="/icons/logo_lab.png"
                        alt="Icono laboratorio"
                        className="h-20 w-20 object-contain rounded-full border-2 border-blue-300 bg-white cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => router.push('/')}
                    />
                    {isAuthenticated && (
                        <span className="text-white font-semibold text-lg hidden sm:block">
                            Sistema de Laboratorio
                        </span>
                    )}
                </div>

                {/* Navigation Links */}
                {isAuthenticated && (
                    <div className="flex items-center gap-4">
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
