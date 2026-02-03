
"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { EstudioForm } from '../../../componentes/EstudioForm'
import authFetch from '../../../utils/authFetch'

const toDateInput = (value?: string | null) => {
    if (!value) return ''
    // Evitar desfases por zona horaria: tomar solo la parte de fecha
    return value.slice(0, 10)
}

interface EstudioExistente {
    id: string | number
    backendId?: number | string
    nombreApellido: string
    dni: string
    fechaEstudio: string
    obraSocial: string
    medico: string
    pdfs?: string[]
    attachments?: Array<{ id: number; url: string; filename?: string }>
    estado?: 'completado' | 'en_proceso' | 'parcial'
}

export default function Page() {
    const searchParams = useSearchParams()
    const [estudioExistente, setEstudioExistente] = useState<EstudioExistente | null>(null)
    const [loading, setLoading] = useState(false)
    const [permitirCambio, setPermitirCambio] = useState(false)

    // Cargar estudio si viene con ID en params
    useEffect(() => {
        const id = searchParams?.get('id')
        if (!id) return

        setLoading(true)
        const loadFromLocal = () => {
            try {
                const raw = localStorage.getItem('estudios_metadata')
                const metas = raw ? JSON.parse(raw) : []
                const encontrado = metas.find((m: any) => m.id === id)

                if (encontrado) {
                    const estudioMapeado: EstudioExistente = {
                        id: encontrado.id,
                        backendId: encontrado.backendId || encontrado.serverId,
                        nombreApellido: encontrado.nombreApellido || encontrado.studyName || '',
                        dni: encontrado.dni || '',
                        fechaEstudio: encontrado.fechaEstudio || encontrado.fecha || '',
                        obraSocial: encontrado.obraSocial || encontrado.socialInsurance || '',
                        medico: encontrado.medico || '',
                        pdfs: encontrado.pdfs || [],
                        estado: encontrado.estado || encontrado.status || 'en_proceso',
                    }
                    console.log('Estudio cargado (local):', estudioMapeado)
                    setEstudioExistente(estudioMapeado)
                    setPermitirCambio(estudioMapeado.estado === 'en_proceso' || estudioMapeado.estado === 'parcial')
                    return true
                }
            } catch (error) {
                console.error('Error cargando estudio local:', error)
            }
            return false
        }

        const loadFromBackend = async () => {
            try {
                const response = await authFetch(`http://localhost:3000/api/studies/${id}`)
                if (!response.ok) {
                    if (response.status === 401) {
                        console.warn('No autorizado: revisa sesión/token')
                    } else {
                        console.warn('Backend no devolvió el estudio, status:', response.status)
                    }
                    return
                }
                const result = await response.json()
                const study = result.data || result
                const estudioMapeado: EstudioExistente = {
                    id: study.id,
                    backendId: study.id,
                    nombreApellido: study.patient?.profile
                        ? `${study.patient.profile.firstName || ''} ${study.patient.profile.lastName || ''}`.trim()
                        : study.studyName || '',
                    dni: study.patient?.dni || study.patient?.documentNumber || '',
                    fechaEstudio: toDateInput(study.studyDate),
                    obraSocial: study.socialInsurance || '',
                    // Médico: tomar solo desde campo 'doctor' del estudio; sin fallback al bioquímico
                    medico: study.doctor || '',
                    pdfs: Array.isArray(study.pdfs) ? study.pdfs : (study.pdfUrl ? [study.pdfUrl] : []),
                    attachments: Array.isArray(study.attachments) ? study.attachments : [],
                    estado: study.status?.name?.toLowerCase() === 'completed' ? 'completado'
                        : study.status?.name?.toLowerCase() === 'partial' ? 'parcial'
                            : 'en_proceso',
                }
                console.log('Estudio cargado (backend):', estudioMapeado)
                setEstudioExistente(estudioMapeado)
                setPermitirCambio(estudioMapeado.estado === 'en_proceso' || estudioMapeado.estado === 'parcial')
            } catch (error) {
                console.error('Error cargando estudio backend:', error)
            }
        }

        // Intenta primero local, si no existe intenta backend
        const foundLocal = loadFromLocal()
        if (!foundLocal) {
            loadFromBackend().finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [searchParams])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600">Cargando estudio...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <EstudioForm
                    estudioExistente={estudioExistente ?? undefined}
                    modoEdicion={!!estudioExistente}
                    permitirCambioEstado={permitirCambio}
                />
            </div>
        </div>
    )
}
