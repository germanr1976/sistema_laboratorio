"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RegistroProfesional() {
    const router = useRouter();
    const [nombre, setNombre] = useState("");
    const [dni, setDni] = useState("");
    const [matricula, setMatricula] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [nombreError, setNombreError] = useState("");
    const [dniError, setDniError] = useState("");
    const [matriculaError, setMatriculaError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loading, setLoading] = useState(false);
    const DNI_MAX = 8;
    const MATRICULA_MAX = 18;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let ok = true;
        if (!nombre.trim()) { setNombreError('Ingrese nombre y apellido'); ok = false; } else setNombreError('');
        if (!dni || dni.length < 8) { setDniError('El DNI debe tener al menos 8 dígitos'); ok = false; } else setDniError('');
        if (!matricula.trim()) { setMatriculaError('Ingrese matrícula'); ok = false; } else setMatriculaError('');
        if (!password) { setPasswordError('Ingrese contraseña'); ok = false; } else if (password.length < 8) { setPasswordError('La contraseña debe tener al menos 8 caracteres'); ok = false; } else setPasswordError('');
        if (password !== confirmPassword) { setPasswordError('Las contraseñas no coinciden'); ok = false; }
        if (!ok) return;
        // Aquí iría la lógica de registro
        // Al completar con éxito, redirigimos al login de administrativos
        // Lógica real de registro: llamar al backend
        const base = process.env.NEXT_PUBLIC_API_URL ?? '';
        // separar nombre en firstName / lastName (aprox)
        const parts = nombre.trim().split(/\s+/);
        const firstName = parts.shift() ?? '';
        const lastName = parts.join(' ');

        try {
            setLoading(true);
            toast.loading('Registrando...');
            const res = await fetch(`${base}/api/auth/register-biochemist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, dni, license: matricula, email, password }),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = json?.message || `Error ${res.status}`;
                toast.dismiss();
                toast.error(msg);
                setLoading(false);
                return;
            }

            toast.dismiss();
            toast.success('Registrado correctamente. Redirigiendo al login...');
            router.push('/login-profesional');
        } catch (err: any) {
            toast.dismiss();
            console.error('Registro error', err);
            toast.error(err?.message || 'Error al conectar con el servidor');
            setLoading(false);
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
                <section className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto mt-16 flex flex-col items-center">
                    <h2 className="text-center text-black font-semibold text-2xl mb-1">Registro administrativo</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">Completá tus datos para crear tu cuenta administrativa</p>
                    <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Nombre y apellido"
                            value={nombre}
                            onChange={e => {
                                const filtered = e.target.value.replace(/\d/g, '');
                                setNombre(filtered);
                                if (!filtered.trim()) setNombreError('Ingrese nombre y apellido'); else setNombreError('');
                            }}
                            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                                const paste = e.clipboardData?.getData('text') ?? '';
                                const filtered = paste.replace(/\d/g, '');
                                e.preventDefault();
                                const newVal = (e.target as HTMLInputElement).value + filtered;
                                setNombre(newVal);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {nombreError && (
                            <p className="text-red-600 text-sm mt-1">{nombreError}</p>
                        )}
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={DNI_MAX}
                            placeholder="DNI"
                            value={dni}
                            onChange={e => {
                                const filtered = e.target.value.replace(/\D/g, '');
                                setDni(filtered);
                                if (!filtered) setDniError('Ingrese DNI'); else if (filtered.length < 8) setDniError('El DNI debe tener al menos 8 dígitos'); else setDniError('');
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
                        <input
                            type="text"
                            placeholder="Matricula"
                            value={matricula}
                            onChange={e => {
                                // permitir solo caracteres alfanuméricos (letras y números)
                                const filtered = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                                setMatricula(filtered);
                                if (!filtered.trim()) setMatriculaError('Ingrese matrícula'); else setMatriculaError('');
                            }}
                            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                                const paste = e.clipboardData?.getData('text') ?? '';
                                const filtered = paste.replace(/[^a-zA-Z0-9]/g, '');
                                e.preventDefault();
                                const newVal = (e.target as HTMLInputElement).value + filtered;
                                setMatricula(newVal.slice(0, MATRICULA_MAX));
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {matriculaError && (
                            <p className="text-red-600 text-sm mt-1">{matriculaError}</p>
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        <div className="relative w-full">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña (mín. 8 caracteres)"
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    if (!e.target.value) setPasswordError('Ingrese contraseña'); else if (e.target.value.length < 8) setPasswordError('La contraseña debe tener al menos 8 caracteres'); else setPasswordError('');
                                }}
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
                        <div className="relative w-full">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirmar contraseña"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
                                tabIndex={-1}
                                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showConfirmPassword ? (
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
                        {passwordError && (
                            <p className="text-red-600 text-sm mt-1">{passwordError}</p>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold py-2 rounded transition`}
                        >
                            {loading ? 'Registrando...' : 'Registrarme'}
                        </button>
                    </form>
                    <Link href="/login-profesional" className="text-blue-500 underline mt-4">Volver al login administrativo</Link>
                </section>
            </main>
        </>
    );
}

