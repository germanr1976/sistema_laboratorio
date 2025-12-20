"use client";


import { useState, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";

import Link from "next/link";

export default function LoginPaciente() {
    const [dni, setDni] = useState("");
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
            const base = process.env.NEXT_PUBLIC_API_URL ?? '';
            const res = await fetch(`${base}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ dni }),
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
                    // If backend indicates a password is required, this means the DNI
                    // belongs to a professional — avoid showing 'Password requerida' in patient login
                    if (msg === 'Password requerida') {
                        const userMsg = 'Paciente no encontrado, ingrese nuevamente su DNI';
                        setDniError(userMsg);
                        toast.error(userMsg);
                        dniInputRef.current?.focus();
                    } else {
                        toast.error(msg);
                    }
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
            try { const { setAuthToken } = await import('@/utils/authFetch'); setAuthToken(token); } catch { }
            toast.success('Login exitoso');
            // Redirigir a home o dashboard
            window.location.href = '/';
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
                    className="absolute top-0 left-0 w-full h-[400px] bg-blue-500 -z-10"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)" }}
                />

                {/* Card central */}
                <section className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto mt-16 flex flex-col items-center">
                    <h2 className="text-center text-black font-semibold text-2xl mb-1">Acceso de pacientes</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">Ingresa con tu DNI para ver tus estudios</p>
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
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white font-semibold py-2 rounded hover:bg-blue-600 transition"
                        >
                            Login
                        </button>
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
