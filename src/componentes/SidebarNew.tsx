"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileEdit, FilePlus, FolderOpen, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/utils/useAuth'

interface EstudioParcial {
    id: string | number
    nombreApellido: string
    dni: string
    estado: string
}

export function Sidebar() {
    const pathname = usePathname()
    const [estudiosParciales, setEstudiosParciales] = useState<EstudioParcial[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const { logout } = useAuth()

    const handleClearDrafts = () => {
        try {
            localStorage.removeItem('estudios_metadata')
            setEstudiosParciales([])
            window.dispatchEvent(new Event('storage'))
        } catch (error) {
            console.error('Error limpiando borradores:', error)
        }
    }

    // Cargar estudios parciales del localStorage
    useEffect(() => {
        const cargarEstudios = () => {
            try {
                const raw = localStorage.getItem('estudios_metadata')
                const metas = raw ? JSON.parse(raw) : []
                // Incluir en_proceso y parciales (borradores)
                const parciales = metas.filter((m: any) => {
                    const estado = m.estado || m.status || ''
                    return estado === 'parcial' || estado === 'en_proceso'
                })
                console.log('Estudios parciales cargados:', parciales)
                setEstudiosParciales(parciales)
            } catch (error) {
                console.error('Error cargando estudios parciales:', error)
            }
        }

        cargarEstudios()

        // Escuchar cambios en localStorage
        window.addEventListener('storage', cargarEstudios)
        return () => window.removeEventListener('storage', cargarEstudios)
    }, [pathname])

    const navItems = [
        {
            label: 'Gestionar Estudios',
            href: '/dashboard',
            icon: FolderOpen,
        },
        {
            label: 'Cargar Nuevo Estudio',
            href: '/cargar-nuevo',
            icon: FilePlus,
        },
    ]

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + '/')
    }

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 md:hidden p-2.5 bg-blue-600 text-white rounded-lg text-base"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed md:sticky md:top-0 w-72 h-screen md:min-h-screen bg-linear-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    } z-40 md:z-0`}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-white text-lg">Laboratorio</h1>
                            <p className="text-sm text-slate-300">Sistema de Estudios</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-base font-semibold transition-colors ${active
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Estudios Parciales */}
                    {estudiosParciales.length > 0 && (
                        <div className="mt-8">
                            <h3 className="px-3 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                                Borradores ({estudiosParciales.length})
                            </h3>
                            <div className="space-y-1">
                                {estudiosParciales.map((estudio) => (
                                    <Link
                                        key={estudio.id}
                                        href={`/cargar-nuevo?id=${estudio.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-base transition-colors group ${pathname === `/cargar-nuevo`
                                            ? 'bg-amber-600/20 text-amber-300'
                                            : 'text-slate-300 hover:bg-amber-600/10 hover:text-amber-300'
                                            }`}
                                    >
                                        <FileEdit className="w-5 h-5 text-amber-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate font-semibold text-base">{estudio.nombreApellido}</p>
                                            <p className="text-sm text-slate-400">DNI: {estudio.dni}</p>
                                        </div>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                    </Link>
                                ))}
                            </div>
                            <button
                                onClick={handleClearDrafts}
                                className="mt-4 w-full px-3.5 py-2.5 text-sm font-semibold text-slate-100 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Borrar borradores locales
                            </button>
                        </div>
                    )}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-white">BQ</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-white truncate">Bioquímico</p>
                            <p className="text-sm text-slate-300">En línea</p>
                        </div>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-base font-semibold text-red-50 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Overlay para cerrar sidebar en mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
