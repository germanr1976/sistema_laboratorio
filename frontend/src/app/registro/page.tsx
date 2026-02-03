"use client";

import Link from "next/link";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";

export default function RegistroPage() {
    const [dni, setDni] = useState("");
    const [nombre, setNombre] = useState("");
    const [dniError, setDniError] = useState("");
    const [nombreError, setNombreError] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
    const DNI_MAX = 8;

    const handleSubmit = (e: React.FormEvent) => {
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
        if (!ok) return;

        // Aquí iría la lógica de registro
        alert(`Registrado: ${nombre} (${dni}, ${fechaNacimiento ? fechaNacimiento.toLocaleDateString() : ""})`);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden z-10">
            {/* Fondo azul inclinado */}
            <div
                className="absolute top-0 left-0 w-full h-[400px] bg-blue-500 -z-10"
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
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white font-semibold py-2 rounded hover:bg-blue-600 transition"
                    >
                        Registrarme
                    </button>
                </form>
                <Link href="/login-paciente" className="text-blue-500 underline mt-4">Volver al login de paciente</Link>
            </section>
        </main>
    );
}

