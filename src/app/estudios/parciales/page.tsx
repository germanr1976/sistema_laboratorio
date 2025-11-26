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

export default function ParcialesPage() {
    const [items, setItems] = useState<Meta[]>([])

    useEffect(() => {
        try {
            const raw = localStorage.getItem('estudios_metadata')
            const metas = raw ? JSON.parse(raw) as Meta[] : []
            const parciales = metas.filter(m => m.status === 'parcial')
            setItems(parciales)
        } catch (e) {
            console.warn('[parciales] no se pudo leer estudios_metadata', e)
            setItems([])
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Estudios parciales</h1>
                {items.length === 0 ? (
                    <div className="p-6 text-gray-600">No hay estudios parciales.</div>
                ) : (
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="font-bold text-gray-800 uppercase text-sm">{item.nombreApellido || '—'}</div>
                                    <div className="text-xs text-gray-600 mt-1">DNI {item.dni || '—'}</div>
                                    <div className="text-xs text-gray-600">Fecha {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '—'}</div>
                                    <div className="text-xs text-gray-600">Obra social: {item.obraSocial || '—'}</div>
                                    <div className="text-xs text-gray-600">Médico: {item.medico || '—'}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link href={`/cargar-nuevo?id=${encodeURIComponent(item.id)}`} className="px-4 py-2 bg-blue-600 text-white rounded">Continuar</Link>
                                    <Link href={`/revision?id=${encodeURIComponent(item.id)}`} className="px-3 py-2 border rounded text-gray-700">Ver</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
