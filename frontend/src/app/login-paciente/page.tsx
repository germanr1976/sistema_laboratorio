"use client";


import { useState, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";

import Link from "next/link";

export default function LoginPaciente() {
    const [dni, setDni] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [dniError, setDniError] = useState("");
    const DNI_MAX = 8;
    const dniInputRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validación previa
        if (!dni) {
            setDniError('Ingrese DNI');
            toast.error('Ingrese DNI válido');
            return;
        }
        if (dni.length < 8) {
            setDniError('El DNI debe tener al menos 8 dígitos');
            toast.error('DNI inválido');
            return;
        }
        try {
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${base}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ dni, password }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = json?.message || `Error ${res.status}`;
                if (res.status === 404) {
                    const userMsg = 'Paciente no encontrado, ingrese nuevamente su DNI';
                    setDniError(userMsg);
                    toast.error(userMsg);
                    dniInputRef.current?.focus();
                } else if (res.status === 400) {
                    toast.error(msg);
                } else if (res.status >= 500) {
                    toast.error('Error interno del servidor');
                } else {
                    toast.error(msg);
                }
                return;
            }

            const token = json?.data?.token;
            if (!token) {
                toast.error('Respuesta inválida del servidor');
                return;
            }

            // Guardar token y notificar
            try {
                const { setAuthToken } = await import('../../utils/authFetch');
                setAuthToken(token);
                // Guardar tipo de usuario
                localStorage.setItem('userType', 'patient');
                if (json?.data?.user) {
                    localStorage.setItem('userData', JSON.stringify(json.data.user));
                }
            } catch { }
            toast.success('Login exitoso');
            // Redirigir al dashboard del paciente
            window.location.href = '/paciente/dashboard';
        } catch (error: any) {
            console.error('Login error', error);
            toast.error(error?.message || 'Error al conectar con el servidor');
        }
    };

    return (
        <>
            {/* Global Toaster in layout handles toasts */}
            <main className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden z-10">
                {/* Fondo azul inclinado */}
                <div
                    className="absolute top-0 left-0 w-full h-100 bg-blue-500 -z-10"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)" }}
                />

                {/* Card central */}
                <section className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto mt-16 flex flex-col items-center">
                    <h2 className="text-center text-black font-semibold text-2xl mb-1">Acceso de pacientes</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">Ingresa con tu DNI y contraseña para ver tus estudios</p>
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-500 rounded shadow-md p-6 flex items-center justify-center">
                            <span className="text-5xl text-white">👤</span>
                        </div>
                    </div>
                    <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
                        <input
                            ref={dniInputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={DNI_MAX}
                            placeholder="DNI"
                            value={dni}
                            onChange={e => {
                                const filtered = e.target.value.replace(/\D/g, '');
                                setDni(filtered);
                                if (!filtered) setDniError('Ingrese DNI');
                                else if (filtered.length < 8) setDniError('El DNI debe tener al menos 8 dígitos');
                                else setDniError('');
                            }}
                            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                                const paste = e.clipboardData?.getData('text') ?? '';
                                const filtered = paste.replace(/\D/g, '');
                                e.preventDefault();
                                const newVal = (e.target as HTMLInputElement).value + filtered;
                                setDni(newVal.slice(0, DNI_MAX));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {dniError && (
                            <p className="text-red-600 text-sm mt-1">{dniError}</p>
                        )}
                        <div className="relative w-full">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
                                tabIndex={-1}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.807 6.07 6.75 9.75 6.75 1.772 0 3.487-.457 4.97-1.277M21.75 12c-.512-.96-1.24-1.927-2.16-2.777m-3.07-2.223A6.75 6.75 0 0 0 12 6.75c-3.68 0-7.714 2.943-9.75 6.75.512.96 1.24 1.927 2.16 2.777m3.07 2.223A6.75 6.75 0 0 0 12 17.25c3.68 0 7.714-2.943 9.75-6.75-.512-.96-1.24-1.927-2.16-2.777m-3.07-2.223A6.75 6.75 0 0 0 12 6.75c-1.772 0-3.487.457-4.97 1.277" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88m-4.24-4.24A3 3 0 0 1 12 9a3 3 0 0 1 2.12.88m-4.24 4.24L3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.807 6.07 6.75 9.75 6.75 1.772 0 3.487-.457 4.97-1.277m3.03-2.223A10.477 10.477 0 0 0 21.75 12c-.512-.96-1.24-1.927-2.16-2.777m-3.07-2.223A6.75 6.75 0 0 0 12 6.75c-1.772 0-3.487.457-4.97 1.277" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white font-semibold py-2 rounded hover:bg-blue-600 transition"
                        >
                            Login
                        </button>
                        <Link href="/recuperar-contrasena?tipo=paciente" className="text-center text-sm text-blue-600 hover:text-blue-800 underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </form>
                    <p className="text-center text-sm mt-6">
                        No tenes cuenta? {" "}
                        <Link href="/registro" className="font-bold underline">Registrate aqui</Link>
                    </p>
                    <Link href="/" className="text-blue-500 underline mt-4">Volver al inicio</Link>
                </section>
            </main>
        </>
    );
}
