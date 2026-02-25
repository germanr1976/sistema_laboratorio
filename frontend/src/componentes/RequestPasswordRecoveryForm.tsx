'use client';

import React, { useState } from 'react';
import Toast from './Toast';

interface RequestPasswordRecoveryFormProps {
    loginHref: string;
    roleLabel: string;
}

export default function RequestPasswordRecoveryForm({ loginHref, roleLabel }: RequestPasswordRecoveryFormProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [sent, setSent] = useState(false);
    const [debugRecoveryLink, setDebugRecoveryLink] = useState<string | null>(null);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email) {
            setToast({ type: 'error', message: 'El email es requerido' });
            return;
        }

        if (!validateEmail(email)) {
            setToast({ type: 'error', message: 'Por favor ingresa un email válido' });
            return;
        }

        setLoading(true);
        try {
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(`${base}/api/auth/request-password-recovery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                setToast({ type: 'error', message: data?.message || 'No se pudo procesar la solicitud' });
                return;
            }

            // Por seguridad, siempre mostramos el mismo mensaje
            setToast({ type: 'success', message: data.message });
            setDebugRecoveryLink(typeof data?.debugRecoveryLink === 'string' ? data.debugRecoveryLink : null);
            setSent(true);
            setEmail('');
        } catch (error) {
            console.error('Error:', error);
            setToast({ type: 'error', message: 'Error al conectar con el servidor' });
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="text-center">
                <div className="mb-4 text-green-600">
                    <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">¡Correo Enviado!</h2>
                <p className="text-gray-600 mb-4">
                    Si el email existe en nuestro sistema, recibirás un enlace de recuperación en tu bandeja de entrada.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Por favor revisa tu carpeta de spam si no lo ves en unos minutos.
                </p>
                {debugRecoveryLink && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
                        <p className="text-sm text-amber-800 mb-2">
                            No se pudo enviar el correo en este momento. Podés continuar la recuperación con este enlace:
                        </p>
                        <a
                            href={debugRecoveryLink}
                            className="inline-block mb-3 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition"
                        >
                            Continuar recuperación ahora
                        </a>
                        <a
                            href={debugRecoveryLink}
                            className="text-sm text-blue-700 underline break-all"
                        >
                            {debugRecoveryLink}
                        </a>
                    </div>
                )}
                <a
                    href={loginHref}
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Volver al Login
                </a>
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        disabled={loading}
                    />
                </div>

                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    Ingresa el email asociado a tu cuenta de {roleLabel}. Recibirás un enlace para restablecer tu contraseña.
                </p>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                    {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </button>

                <a
                    href={loginHref}
                    className="block text-center text-blue-600 hover:text-blue-800 text-sm mt-4"
                >
                    Volver al Login
                </a>
            </form>

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
