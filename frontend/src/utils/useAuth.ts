"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from './authFetch';

export interface UserData {
    id?: string;
    dni?: string;
    nombre?: string;
    nombreApellido?: string;
    email?: string;
    role?: string;
    [key: string]: any;
}

export function useAuth(redirectTo: string = '/') {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userType, setUserType] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const token = getAuthToken();

            if (!token) {
                setIsLoading(false);
                router.push(redirectTo);
                return;
            }

            // Obtener información del usuario
            const storedUserType = localStorage.getItem('userType');
            const storedUserData = localStorage.getItem('userData');

            setUserType(storedUserType);

            if (storedUserData) {
                try {
                    const parsed = JSON.parse(storedUserData);
                    setUserData(parsed);
                } catch (e) {
                    console.error('Error parsing user data', e);
                }
            }

            setIsAuthenticated(true);
            setIsLoading(false);
        };

        checkAuth();
    }, [router, redirectTo]);

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        sessionStorage.setItem('justLoggedOut', 'true');
        router.push('/');
    };

    return {
        isAuthenticated,
        isLoading,
        userType,
        userData,
        logout
    };
}
