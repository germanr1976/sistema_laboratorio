
"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { EstudioForm } from '../../../componentes/EstudioForm'
import authFetch from '../../../utils/authFetch'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

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

interface LocalStudyMeta {
    id?: string
    backendId?: number | string
    serverId?: number | string
    nombreApellido?: string
    studyName?: string
    dni?: string
    fechaEstudio?: string
    fecha?: string
    obraSocial?: string
    socialInsurance?: string
    medico?: string
    pdfs?: string[]
    estado?: 'completado' | 'en_proceso' | 'parcial'
    status?: 'completado' | 'en_proceso' | 'parcial'
}

function CargarNuevoContent() {
    const searchParams = useSearchParams()
    const datosPacienteBloqueados = searchParams?.get('bloqDatos') === 'true'
    const [estudioExistente, setEstudioExistente] = useState<EstudioExistente | null>(null)
    const [loading, setLoading] = useState(false)
    const [permitirCambio, setPermitirCambio] = useState(false)

    // Cargar estudio si viene con ID en params
    useEffect(() => {
        const id = searchParams?.get('id')

        if (!id) return

        const loadingTimer = window.setTimeout(() => setLoading(true), 0)
        const loadFromLocal = () => {
            try {
                const raw = localStorage.getItem('estudios_metadata')
                const metas = raw ? (JSON.parse(raw) as LocalStudyMeta[]) : []
                const encontrado = metas.find((m: LocalStudyMeta) => m.id === id)

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

                    const nombreGenerico = (estudioMapeado.nombreApellido || '').trim().toLowerCase() === 'estudio solicitado por paciente'
                    if (nombreGenerico) {
                        console.log('Nombre local genérico detectado, se solicitará nombre real al backend')
                        return false
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
                const response = await authFetch(`${API_URL}/api/studies/${id}`)
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

                // Extraer nombre con múltiples fallbacks (priorizar nombre real del paciente)
                let nombreCompleto = ''
                if (study.patient?.fullName) {
                    nombreCompleto = String(study.patient.fullName).trim()
                } else if (study.patient?.profile?.firstName || study.patient?.profile?.lastName) {
                    nombreCompleto = `${study.patient.profile.firstName || ''} ${study.patient.profile.lastName || ''}`.trim()
                } else if (study.patient?.firstName || study.patient?.lastName) {
                    nombreCompleto = `${study.patient.firstName || ''} ${study.patient.lastName || ''}`.trim()
                } else if (study.studyName) {
                    nombreCompleto = study.studyName
                }

                console.log('📦 Datos del backend:', {
                    studyId: study.id,
                    patientProfile: study.patient?.profile,
                    patient: study.patient,
                    studyName: study.studyName,
                    nombreCompleto: nombreCompleto,
                })

                const estudioMapeado: EstudioExistente = {
                    id: study.id,
                    backendId: study.id,
                    nombreApellido: nombreCompleto,
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
            window.setTimeout(() => setLoading(false), 0)
        }
        return () => window.clearTimeout(loadingTimer)
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
                    datosPacienteBloqueados={datosPacienteBloqueados}
                />
            </div>
        </div>
    )
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        }>
            <CargarNuevoContent />
        </Suspense>
    )
}
