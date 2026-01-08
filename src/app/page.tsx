
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authFetch, { getAuthToken } from '@/utils/authFetch';

export default function HomePage() {
    const [selected, setSelected] = useState<'paciente' | 'profesional' | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Si el usuario ya está autenticado, redirigir al dashboard
        const token = getAuthToken();
        if (token) {
            router.push('/dashboard');
        }
    }, [router]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden z-10">
            {/* Fondo azul inclinado solo en el home */}
            <div
                className="absolute top-0 left-0 w-full h-[400px] bg-blue-500 -z-10"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)' }}
            />

            {/* Card central */}
            <section className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto mt-16 flex flex-col items-center">
                <h2 className="text-center  text-black font-semibold text-lg mb-2">Gestión Digital de Estudios Médicos</h2>
                <p className="text-center text-gray-700 text-sm mb-6">
                    Plataforma integral para laboratorios que permite a pacientes consultar sus resultados y a bioquímicos gestionar estudios de manera eficiente y segura
                </p>

                <p className="text-center text-black font-semibold text-sm mb-6">Selecciona tu tipo de acceso:</p>

                {/* Iconos de usuario y escudo */}
                <div className="flex justify-center gap-2 mb-6">
                    <button
                        className={`bg-gray-200 rounded p-2 border ${selected === 'paciente' ? 'border-blue-500' : 'border-gray-300'} focus:outline-none`}
                        onClick={() => setSelected('paciente')}
                        aria-label="Ingreso Paciente"
                    >
                        <span role="img" aria-label="user">👤</span>
                    </button>
                    <button
                        className={`bg-gray-200 rounded p-2 border ${selected === 'profesional' ? 'border-blue-500' : 'border-gray-300'} focus:outline-none`}
                        onClick={() => setSelected('profesional')}
                        aria-label="Ingreso Profesional"
                    >
                        <span role="img" aria-label="shield">🛡️</span>
                    </button>
                </div>

                {/* Acceso según selección */}
                {selected === 'profesional' && (
                    <div className="bg-gray-100 rounded-lg p-6 w-full mb-2 animate-fade-in">
                        <h3 className="text-center text-xl font-semibold text-gray-800 mb-2">Acceso Admistrativo</h3>
                        <p className="text-center text-gray-600 text-sm mb-4">Panel de gestión para bioquímicos y personal del laboratorio</p>
                        <button
                            className="block w-full bg-white border border-blue-400 text-blue-600 font-medium py-2 rounded hover:bg-blue-50 transition mb-2"
                            onClick={() => router.push('/login-profesional')}
                        >
                            Ingresar
                        </button>
                        <p className="text-center text-xs text-gray-400">Acceso restringido para personal autorizado</p>
                    </div>
                )}
                {selected === 'paciente' && (
                    <div className="bg-gray-100 rounded-lg p-6 w-full mb-2 animate-fade-in">
                        <h3 className="text-center text-xl font-semibold text-gray-800 mb-2">Acceso Paciente</h3>
                        <p className="text-center text-gray-600 text-sm mb-4">Consulta tus resultados de laboratorio de forma segura</p>
                        <button
                            className="block w-full bg-white border border-blue-400 text-blue-600 font-medium py-2 rounded hover:bg-blue-50 transition mb-2"
                            onClick={() => router.push('/login-paciente')}
                        >
                            Ingresar como Paciente
                        </button>
                        <p className="text-center text-xs text-gray-400">Acceso solo para pacientes registrados</p>
                    </div>
                )}
            </section>
        </main>
    );
}
