"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { cardClasses, leftColClasses, nameClasses, metaClasses, rightActionsClasses, btnPrimary, badgeEnProceso } from '../../../utils/uiClasses'

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
        <div className="p-6">
            <h1 className="text-2xl font-bold text-black mb-4">Estudios en proceso</h1>
            {items.length === 0 ? (
                <p className="text-gray-600">No hay estudios en proceso todavía.</p>
            ) : (
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className={cardClasses}>

                            <div className={leftColClasses}>
                                <div className="flex flex-col gap-1">
                                    <div className={nameClasses}>{item.nombreApellido || '—'}</div>
                                    <div className={metaClasses}>
                                        <span className="truncate">DNI {item.dni || '—'}</span>
                                        <span className="truncate">Fecha {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '—'}</span>
                                        <span className="truncate">Obra social {item.obraSocial || '—'}</span>
                                        <span className="truncate">Médico: {item.medico || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={rightActionsClasses}>
                                {item.status === 'en_proceso' || item.status === 'en proceso' ? (
                                    <span className={badgeEnProceso}>En proceso</span>
                                ) : null}

                                <Link href={`/cargar-nuevo?id=${encodeURIComponent(item.id)}`} className={btnPrimary}>Cargar Estudio</Link>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
