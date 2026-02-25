'use client';

import React, { useState } from 'react';
import Toast from './Toast';
import { resolveApiBaseUrl } from '../utils/apiBaseUrl';

interface ResetPasswordFormProps {
    token: string;
    loginHref: string;
}

export default function ResetPasswordForm({ token, loginHref }: ResetPasswordFormProps) {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.newPassword || !formData.confirmPassword) {
            setToast({ type: 'error', message: 'Todos los campos son requeridos' });
            return false;
        }

        if (formData.newPassword.length < 8) {
            setToast({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres' });
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setToast({ type: 'error', message: 'Las contraseñas no coinciden' });
            return false;
        }

        // Validar que tenga mayúsculas, minúsculas y números
        const hasUpperCase = /[A-Z]/.test(formData.newPassword);
        const hasLowerCase = /[a-z]/.test(formData.newPassword);
        const hasNumbers = /\d/.test(formData.newPassword);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            setToast({
                type: 'error',
                message: 'La contraseña debe contener mayúsculas, minúsculas y números'
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const base = resolveApiBaseUrl();
            if (!base) {
                setToast({
                    type: 'error',
                    message: 'Configuración inválida: NEXT_PUBLIC_API_URL no está definida correctamente'
                });
                return;
            }

            const response = await fetch(`${base}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword
                })
            });

            const raw = await response.text();
            let data: any = {};
            if (raw) {
                try {
                    data = JSON.parse(raw);
                } catch {
                    data = {};
                }
            }

            if (response.ok) {
                setSuccess(true);
                setToast({ type: 'success', message: data?.message || 'Contraseña restablecida correctamente' });
                setTimeout(() => {
                    window.location.href = loginHref;
                }, 2000);
            } else {
                setToast({ type: 'error', message: data?.message || `Error ${response.status} al restablecer contraseña` });
            }
        } catch (error) {
            console.error('Error:', error);
            setToast({ type: 'error', message: 'Error al conectar con el servidor' });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="mb-4 text-green-600">
                    <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">¡Contraseña Restablecida!</h2>
                <p className="text-gray-600 mb-4">Serás redirigido al login en breve...</p>
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Ingresa tu nueva contraseña"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirma tu contraseña"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                        >
                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <p className="font-semibold mb-2">Requisitos de contraseña:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Mínimo 8 caracteres</li>
                        <li>Al menos una mayúscula</li>
                        <li>Al menos una minúscula</li>
                        <li>Al menos un número</li>
                    </ul>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                    {loading ? 'Procesando...' : 'Restablecer Contraseña'}
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
