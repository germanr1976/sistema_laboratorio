"use client";

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setPlatformAuthToken } from '../../../utils/platformAuth';

export default function PlatformLoginPage() {
    const router = useRouter();
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(`${base}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ dni, password }),
            });

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(json?.message || 'No se pudo iniciar sesión');
                return;
            }

            const user = json?.data?.user;
            const token = json?.data?.token;
            if (!user || !token) {
                setError('Respuesta inválida del servidor');
                return;
            }

            const role = String(user?.role || '').toUpperCase();
            const hasPlatformAccess = role === 'PLATFORM_ADMIN' || Boolean(user?.isPlatformAdmin);
            if (!hasPlatformAccess) {
                setError('Tu usuario no tiene acceso al portal de plataforma.');
                return;
            }

            setPlatformAuthToken(token);
            localStorage.setItem('platformUserType', 'platform');
            localStorage.setItem('platformUserData', JSON.stringify(user));
            router.push('/platform/tenants');
        } catch (err) {
            console.error(err);
            setError('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
            <section className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-8">
                <p className="text-xs uppercase tracking-wider text-slate-400">Portal Empresa</p>
                <h1 className="mt-2 text-2xl font-semibold">Acceso Plataforma</h1>
                <p className="mt-2 text-sm text-slate-300">Ingreso exclusivo para administración global del SaaS.</p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="DNI"
                        value={dni}
                        onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                        required
                    />

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium disabled:opacity-60"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar a Plataforma'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-sm text-slate-300 underline">
                        Volver al inicio
                    </Link>
                </div>
            </section>
        </main>
    );
}
