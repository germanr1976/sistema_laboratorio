"use client"

import { useEffect, useState } from "react"
import { getPdf } from "../../../utils/estudiosStore"
import { Share2, Download, Trash2 } from "lucide-react"
import { cardClasses, leftColClasses, nameClasses, metaClasses, rightActionsClasses, btnPdf, btnNoFile, iconBtn, badgeCompletado } from "../../../utils/uiClasses"

type EstudioMeta = {
    id?: string
    nombreApellido?: string
    dni?: string
    fecha?: string
    obraSocial?: string
    medico?: string
    pdfUrl?: string
    status?: string
}

export default function CompletadosPage() {
    const [completados, setCompletados] = useState<EstudioMeta[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const raw = localStorage.getItem('estudios_metadata')
                if (!raw) {
                    if (mounted) setCompletados([])
                    return
                }
                const metas = JSON.parse(raw) as EstudioMeta[]
                const onlyCompleted = metas.filter(m => m.status === 'completado')
                const dedupMap: Record<string, EstudioMeta> = {}
                onlyCompleted.forEach(m => { if (m.id) dedupMap[m.id] = m })
                const deduped = Object.values(dedupMap)

                const resolved = await Promise.all(deduped.map(async (m) => {
                    if (m.id && !m.pdfUrl) {
                        try {
                            const blob = await getPdf(m.id)
                            if (blob) {
                                const url = URL.createObjectURL(blob)
                                return { ...m, pdfUrl: url }
                            }
                        } catch { }
                    }
                    return m
                }))

                if (mounted) setCompletados(resolved)
            } catch (e) {
                console.error('Error cargando completados', e)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    if (loading) return <div>Cargando completados...</div>

    function handleDelete(id: string | undefined): void {
        throw new Error("Function not implemented.")
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-black mb-4">Estudios completados</h1>
            {completados.length === 0 ? (
                <p className="text-gray-600">No hay estudios completados todavía.</p>
            ) : (
                <div className="space-y-4">
                    {completados.map((e) => (
                        <div key={e.id} className={cardClasses}>

                            <div className={leftColClasses}>
                                <div className="flex flex-col gap-1">
                                    <div className={nameClasses}>{e.nombreApellido}</div>
                                    <div className={metaClasses}>
                                        <span className="truncate">DNI {e.dni}</span>
                                        <span className="truncate">Fecha {e.fecha}</span>
                                        <span className="truncate">Obra social {e.obraSocial}</span>
                                        <span className="truncate">Médico: {e.medico}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={rightActionsClasses}>
                                {e.status === "completado" && (
                                    <span className={badgeCompletado}>Completado</span>
                                )}

                                {e.pdfUrl ? (
                                    <a href={e.pdfUrl} target="_blank" rel="noopener noreferrer" className={btnPdf}>ver PDF</a>
                                ) : (
                                    <button className={btnNoFile}>Sin archivo</button>
                                )}

                                <button className={`${iconBtn} hover:bg-sky-500`} title="Compartir estudio">
                                    <Share2 size={16} />
                                </button>

                                <button className={`${iconBtn} hover:bg-green-500`} title="Descargar estudio">
                                    <Download size={16} />
                                </button>

                                <button onClick={() => handleDelete(e.id)} title="Eliminar estudio" className={`${iconBtn} hover:bg-red-500`}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
