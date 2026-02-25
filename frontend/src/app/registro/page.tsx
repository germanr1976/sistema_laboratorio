"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import { toast } from "react-hot-toast";

export default function RegistroPage() {
    const router = useRouter();
    const [dni, setDni] = useState("");
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [dniError, setDniError] = useState("");
    const [nombreError, setNombreError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loading, setLoading] = useState(false);
    const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
    const DNI_MAX = 8;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validaciones
        let ok = true;
        if (!nombre.trim()) {
            setNombreError('Ingrese nombre y apellido');
            ok = false;
        }
        if (!dni || dni.length < 8) {
            setDniError('El DNI debe tener al menos 8 dígitos');
            ok = false;
        }
        if (!password) {
            setPasswordError('Ingrese contraseña');
            ok = false;
        } else if (password.length < 8) {
            setPasswordError('La contraseña debe tener al menos 8 caracteres');
            ok = false;
        } else {
            setPasswordError('');
        }
        if (password !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden');
            ok = false;
        }
        if (!fechaNacimiento) {
            toast.error('Seleccione fecha de nacimiento');
            ok = false;
        }
        if (!ok) return;

        const [firstName, ...lastNameParts] = nombre.trim().split(/\s+/);
        const lastName = lastNameParts.join(' ') || firstName;

        try {
            setLoading(true);
            toast.loading('Registrando...');
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(`${base}/api/auth/register-patient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    dni,
                    email,
                    password,
                    birthDate: fechaNacimiento?.toISOString().split('T')[0]
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                toast.dismiss();
                toast.error(data?.message || `Error ${response.status}`);
                setLoading(false);
                return;
            }

            toast.dismiss();
            toast.success('Registro exitoso. Ya podés iniciar sesión');
            router.push('/login-paciente');
        } catch (error: any) {
            toast.dismiss();
            toast.error(error?.message || 'Error al conectar con el servidor');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden z-10">
            {/* Fondo azul inclinado */}
            <div
                className="absolute top-0 left-0 w-full h-100 bg-blue-500 -z-10"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)" }}
            />
            <section className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto mt-16 flex flex-col items-center">
                <h2 className="text-center text-black font-semibold text-2xl mb-1">Registro de paciente</h2>
                <p className="text-center text-gray-500 text-sm mb-6">Completá tus datos para crear tu cuenta</p>
                <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Nombre y apellido"
                        value={nombre}
                        onChange={e => {
                            // eliminar dígitos del nombre
                            const filtered = e.target.value.replace(/\d/g, '');
                            setNombre(filtered);
                            if (!filtered.trim()) setNombreError('Ingrese nombre y apellido');
                            else setNombreError('');
                        }}
                        onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                            const paste = e.clipboardData?.getData('text') ?? '';
                            const filtered = paste.replace(/\d/g, '');
                            e.preventDefault();
                            const newVal = (e.target as HTMLInputElement).value + filtered;
                            setNombre(newVal);
                            if (!newVal.trim()) setNombreError('Ingrese nombre y apellido');
                            else setNombreError('');
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
                            if (!newVal) setDniError('Ingrese DNI');
                            else if (newVal.length < 8) setDniError('El DNI debe tener al menos 8 dígitos');
                            else setDniError('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    {dniError && (
                        <p className="text-red-600 text-sm mt-1">{dniError}</p>
                    )}

                    {/* @ts-ignore */}
                    <DatePicker
                        selected={fechaNacimiento}
                        onChange={(date) => setFechaNacimiento(Array.isArray(date) ? date[0] : date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Fecha de nacimiento"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        maxDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        locale={es as any}
                        required
                    />
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
                            {showPassword ? '👁️' : '👁️‍🗨️'}
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
                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
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
                <Link href="/login-paciente" className="text-blue-500 underline mt-4">Volver al login de paciente</Link>
            </section>
        </main>
    );
}

