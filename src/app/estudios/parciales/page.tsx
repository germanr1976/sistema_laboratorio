"use client"

import { useEffect, useState } from "react"
import { getPdf } from "../../../utils/estudiosStore"
import { Share2, Download } from "lucide-react"
import { cardClasses, leftColClasses, nameClasses, metaClasses, rightActionsClasses, btnPdf, btnNoFile, iconBtn, badgeParcial } from "../../../utils/uiClasses"

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

export default function ParcialesPage() {
    const [parciales, setParciales] = useState<EstudioMeta[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const createdUrls: string[] = []

        async function load() {
            try {
                const raw = localStorage.getItem('estudios_metadata')
                if (!raw) {
                    if (mounted) setParciales([])
                    return
                }
                const metas = JSON.parse(raw) as EstudioMeta[]
                const onlyPartial = metas.filter(m => m.status === 'parcial')
                const dedupMap: Record<string, EstudioMeta> = {}
                onlyPartial.forEach(m => { if (m.id) dedupMap[m.id] = m })
                const deduped = Object.values(dedupMap)

                const resolved = await Promise.all(deduped.map(async (m) => {
                    if (m.id && !m.pdfUrl) {
                        try {
                            const blob = await getPdf(m.id)
                            if (blob) {
                                const url = URL.createObjectURL(blob)
                                createdUrls.push(url)
                                return { ...m, pdfUrl: url }
                            }
                        } catch { }
                    }
                    return m
                }))

                if (mounted) setParciales(resolved)
            } catch (e) {
                console.error('Error cargando parciales', e)
                if (mounted) setParciales([])
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()

        return () => {
            mounted = false
            // revoke any created object URLs
            try {
                createdUrls.forEach(u => { try { URL.revokeObjectURL(u) } catch { } })
            } catch { /* ignore */ }
        }
    }, [])

    if (loading) return <div>Cargando parciales...</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-black mb-4">Estudios parciales</h1>
            {parciales.length === 0 ? (
                <p className="text-gray-600">No hay estudios parciales.</p>
            ) : (
                <div className="space-y-4">
                    {parciales.map((e) => (
                        <div key={e.id} className={cardClasses}>

                            <div className={leftColClasses}>
                                <div className="font-bold text-gray-900">{e.nombreApellido}</div>
                                <div className="flex flex-wrap text-sm text-gray-600 gap-3">
                                    <span className="truncate">DNI {e.dni}</span>
                                    <span className="truncate">Fecha {e.fecha}</span>
                                    <span className="truncate">Obra social {e.obraSocial}</span>
                                    <span className="truncate">Médico: {e.medico}</span>
                                </div>
                            </div>

                            <div className={rightActionsClasses}>
                                {e.status === "parcial" && (
                                    <span className={badgeParcial}>Parcial</span>
                                )}

                                {e.pdfUrl ? (
                                    <a href={e.pdfUrl} target="_blank" rel="noopener noreferrer" className={btnPdf}>ver PDF</a>
                                ) : (
                                    <button className={btnNoFile}>Sin archivo</button>
                                )}

                                <button className={iconBtn}>
                                    <Share2 size={16} />
                                </button>

                                <button className={iconBtn}>
                                    <Download size={16} />
                                </button>

                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
