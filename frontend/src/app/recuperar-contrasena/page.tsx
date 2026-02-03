'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ResetPasswordForm from '../../componentes/ResetPasswordForm';
import RequestPasswordRecoveryForm from '../../componentes/RequestPasswordRecoveryForm';

function RecuperarContrasenaContent() {
    const searchParams = useSearchParams();
    // Intentar obtener el token de múltiples formas para máxima compatibilidad
    let token = searchParams.get('token');

    // Si no hay token, intentar decodificar URLs mal codificadas
    if (!token) {
        // A veces los navegadores pueden pasar el token de forma diferente
        const allParams = searchParams.toString();
        const tokenMatch = allParams.match(/token=([^&]*)/);
        if (tokenMatch) {
            token = decodeURIComponent(tokenMatch[1]);
        }
    }

    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    useEffect(() => {
        if (!token) {
            setIsValidToken(false);
        } else {
            setIsValidToken(true);
        }
    }, [token]);

    if (isValidToken === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 via-indigo-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (isValidToken === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-indigo-50 to-slate-100 px-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Recuperar Contraseña</h1>
                    <p className="text-center text-gray-600 mb-6">
                        Ingresa tu email para recibir un enlace de recuperación
                    </p>
                    <RequestPasswordRecoveryForm />
                </div>
            </div>
        );
    }

    // Si hay token válido, mostrar formulario de reset
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-indigo-50 to-slate-100 px-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Restablecer Contraseña</h1>
                <p className="text-center text-gray-600 mb-6">
                    Ingresa tu nueva contraseña para recuperar acceso a tu cuenta
                </p>
                <ResetPasswordForm token={token!} />
            </div>
        </div>
    );
}

export default function RecuperarContrasena() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 via-indigo-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        }>
            <RecuperarContrasenaContent />
        </Suspense>
    );
}