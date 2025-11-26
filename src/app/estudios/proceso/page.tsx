"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type Meta = {
    id: string
    nombreApellido?: string
    dni?: string
    fecha?: string
    obraSocial?: string
    medico?: string
    status?: string
}

export default function ProcesoPage() {
    const [items, setItems] = useState<Meta[]>([])

    useEffect(() => {
        try {
            const raw = localStorage.getItem('estudios_metadata')
            const metas = raw ? JSON.parse(raw) as Meta[] : []
            const proceso = metas.filter(m => m.status === 'en_proceso')
            setItems(proceso)
        } catch (e) {
            console.warn('[proceso] no se pudo leer estudios_metadata', e)
            setItems([])
        }
    }, [])

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-3xl mx-auto bg-white rounded-lg p-8 shadow">
                    <h1 className="text-2xl font-bold mb-4">Estudios en proceso</h1>
                    <p className="text-gray-600">No hay estudios en proceso. Podés crear uno desde el Dashboard o desde "Cargar nuevo".</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Estudios en proceso</h1>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-gray-800 uppercase text-sm">{item.nombreApellido || '—'}</div>
                                            <span className="inline-block bg-yellow-200 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">En proceso</span>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-2">DNI {item.dni || '—'}</div>
                                        <div className="text-xs text-gray-600">Fecha {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '—'}</div>
                                        <div className="text-xs text-gray-600">Obra social : {item.obraSocial || '—'}</div>
                                        <div className="text-xs text-gray-600">Medico: {item.medico || '—'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link href={`/cargar-nuevo?id=${encodeURIComponent(item.id)}`} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded">Cargar Estudio</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
