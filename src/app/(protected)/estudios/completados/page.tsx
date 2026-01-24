"use client"

import { useEffect, useState } from "react"
import authFetch from "@/utils/authFetch"
import { Share2, Download, Trash2 } from "lucide-react"
import { cardClasses, leftColClasses, nameClasses, metaClasses, rightActionsClasses, btnPdf, btnNoFile, iconBtn, badgeCompletado } from "@/utils/uiClasses"

type EstudioMeta = {
    id?: number | string
    studyName?: string
    studyDate?: string
    socialInsurance?: string
    pdfUrl?: string
    pdfs?: string[]
    status?: {
        name: string
    }
    patient?: {
        dni?: string
        profile?: {
            firstName?: string
            lastName?: string
            documentNumber?: string
        }
    }
    biochemist?: {
        profile?: {
            firstName?: string
            lastName?: string
        }
    }
}

export default function CompletadosPage() {
    const [completados, setCompletados] = useState<EstudioMeta[]>([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        let mounted = true

        async function load() {
            try {
                const response = await authFetch('http://localhost:3000/api/studies/biochemist/me')

                if (!response.ok) {
                    throw new Error('Error al cargar estudios')
                }

                const result = await response.json()
                const studies = result.data || []

                // Filtrar solo los completados
                const onlyCompleted = studies.filter((study: EstudioMeta) =>
                    study.status?.name === 'COMPLETED'
                )

                if (mounted) setCompletados(onlyCompleted)
            } catch (e) {
                console.error('Error cargando completados', e)
                if (mounted) setCompletados([])
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [])

    if (!mounted) return null

    if (loading) return (
        <div className="p-6">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Cargando estudios completados...</p>
            </div>
        </div>
    )

    async function handleDelete(id: number | string | undefined): Promise<void> {
        if (!id) return

        if (confirm('¿Estás seguro de que deseas eliminar este estudio?')) {
            try {
                const response = await authFetch(`http://localhost:3000/api/studies/${id}`, {
                    method: 'DELETE'
                })

                if (response.ok) {
                    setCompletados(completados.filter(c => c.id !== id))
                    alert('Estudio eliminado exitosamente')
                } else {
                    alert('No se pudo eliminar el estudio')
                }
            } catch (error) {
                console.error('Error eliminando estudio:', error)
                alert('Error al eliminar el estudio')
            }
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-black mb-4">Estudios completados</h1>
            {completados.length === 0 ? (
                <p className="text-gray-600">No hay estudios completados todavía.</p>
            ) : (
                <div className="space-y-4">
                    {completados.map((e) => {
                        const nombreApellido = e.patient?.profile
                            ? `${e.patient.profile.firstName || ''} ${e.patient.profile.lastName || ''}`.trim()
                            : 'Sin nombre'
                        const dni = e.patient?.dni || e.patient?.profile?.documentNumber || 'Sin DNI'
                        const fecha = e.studyDate ? new Date(e.studyDate).toLocaleDateString('es-AR') : 'Sin fecha'
                        const obraSocial = e.socialInsurance || 'Sin obra social'
                        const pdfUrl = e.pdfUrl ? `http://localhost:3000${e.pdfUrl}` : null
                        const estudioNombre = e.studyName || 'Sin nombre'

                        return (
                            <div key={e.id} className={cardClasses}>

                                <div className={leftColClasses}>
                                    <div className="flex flex-col gap-1">
                                        <div className={nameClasses}>{nombreApellido}</div>
                                        <div className={metaClasses}>
                                            <span className="truncate">DNI {dni}</span>
                                            <span className="truncate">Fecha {fecha}</span>
                                            <span className="truncate">Obra social {obraSocial}</span>
                                            <span className="truncate">Estudio: {estudioNombre}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={rightActionsClasses}>
                                    <span className={badgeCompletado}>Completado</span>

                                    {Array.isArray(e.pdfs) && e.pdfs.length > 0 ? (
                                        <div className="mt-2 w-full flex flex-wrap gap-2">
                                            {e.pdfs.map((p, idx) => {
                                                const fullUrl = `http://localhost:3000${p}`
                                                return (
                                                    <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-white text-xs">
                                                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver</a>
                                                        <a href={fullUrl} download className="p-1 hover:bg-slate-700 rounded" title="Descargar">
                                                            <Download size={12} />
                                                        </a>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await navigator.clipboard.writeText(fullUrl)
                                                                    alert('Enlace copiado al portapapeles')
                                                                } catch {
                                                                    prompt('Copiá el enlace:', fullUrl)
                                                                }
                                                            }}
                                                            className="p-1 hover:bg-slate-700 rounded"
                                                            title="Compartir"
                                                        >
                                                            <Share2 size={12} />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        pdfUrl ? (
                                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={btnPdf}>ver PDF</a>
                                        ) : (
                                            <button className={btnNoFile}>Sin archivo</button>
                                        )
                                    )}

                                    <button className={`${iconBtn} hover:bg-sky-500`} title="Compartir estudio">
                                        <Share2 size={16} />
                                    </button>

                                    {pdfUrl && !e.pdfs?.length && (
                                        <a href={pdfUrl} download className={`${iconBtn} hover:bg-green-500`} title="Descargar estudio">
                                            <Download size={16} />
                                        </a>
                                    )}

                                    <button onClick={() => handleDelete(e.id)} title="Eliminar estudio" className={`${iconBtn} hover:bg-red-500`}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
