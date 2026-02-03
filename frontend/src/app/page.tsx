"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authFetch, { getAuthToken } from '../utils/authFetch';

export default function HomePage() {
    const [selected, setSelected] = useState<'paciente' | 'profesional' | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Limpiar el flag de logout si existe
        const justLoggedOut = sessionStorage.getItem('justLoggedOut');
        if (justLoggedOut) {
            sessionStorage.removeItem('justLoggedOut');
        }
        setIsChecking(false);
    }, [router]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 relative overflow-hidden z-10">
            {/* Fondo azul inclinado solo en el home */}
            <div
                className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-br from-blue-500 to-blue-600 -z-10"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)' }}
            />

            {/* Card central */}
            <section className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-12 max-w-xl w-full mx-auto mt-16 flex flex-col items-center">
                <h2 className="text-center  text-black font-semibold text-2xl mb-3">Gestión Digital de Estudios Médicos</h2>
                <p className="text-center text-gray-700 text-base mb-8">
                    Plataforma integral para laboratorios que permite a pacientes consultar sus resultados y a bioquímicos gestionar estudios de manera eficiente y segura
                </p>

                <p className="text-center text-black font-semibold text-base mb-8">Selecciona tu tipo de acceso:</p>

                {/* Iconos de usuario y escudo */}
                <div className="flex justify-center gap-8 mb-8">
                    <div className="flex flex-col items-center gap-3">
                        <button
                            className={`bg-gray-200 rounded-lg p-4 border-2 ${selected === 'paciente' ? 'border-blue-500' : 'border-gray-300'} focus:outline-none text-2xl transition-all hover:shadow-md`}
                            onClick={() => setSelected('paciente')}
                            aria-label="Ingreso Paciente"
                        >
                            <span role="img" aria-label="user">👤</span>
                        </button>
                        <p className="text-center text-gray-700 font-medium text-sm">Paciente</p>
                        <p className="text-center text-gray-500 text-xs max-w-[120px]">Consulta tus resultados</p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <button
                            className={`bg-gray-200 rounded-lg p-4 border-2 ${selected === 'profesional' ? 'border-blue-500' : 'border-gray-300'} focus:outline-none text-2xl transition-all hover:shadow-md`}
                            onClick={() => setSelected('profesional')}
                            aria-label="Ingreso Profesional"
                        >
                            <span role="img" aria-label="shield">🛡️</span>
                        </button>
                        <p className="text-center text-gray-700 font-medium text-sm">Profesional</p>
                        <p className="text-center text-gray-500 text-xs max-w-[120px]">Gestión de estudios</p>
                    </div>
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