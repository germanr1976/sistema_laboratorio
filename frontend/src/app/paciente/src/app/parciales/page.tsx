"use client"

import { useEffect, useState } from "react"
import { getPdf } from "../../utils/estudiosStore"
import { Share2, Download } from "lucide-react"

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
        async function load() {
            try {
                const raw = localStorage.getItem('estudios_metadata')
                if (!raw) {
                    if (mounted) setParciales([])
                    return
                }
                const metas = JSON.parse(raw) as EstudioMeta[]
                const onlyParcial = metas.filter(m => m.status === 'parcial')
                const dedupMap: Record<string, EstudioMeta> = {}
                onlyParcial.forEach(m => { if (m.id) dedupMap[m.id] = m })
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

                if (mounted) setParciales(resolved)
            } catch (e) {
                console.error('Error cargando parciales', e)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    if (loading) return <div>Cargando parciales...</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-700 mb-4">Estudios parciales</h1>
            {parciales.length === 0 ? (
                <p className="text-gray-600">No hay estudios parciales.</p>
            ) : (
                <div className="space-y-4">
                    {parciales.map((e) => (
                        <div key={e.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">

                            <div className="flex flex-col gap-1">
                                <div className="font-bold text-gray-900">{e.nombreApellido}</div>
                                <div className="flex flex-wrap text-sm text-gray-600 gap-3">
                                    <span>DNI {e.dni}</span>
                                    <span>Fecha {e.fecha}</span>
                                    <span>Obra social {e.obraSocial}</span>
                                    <span>Médico: {e.medico}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {e.status === "parcial" && (
                                    <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full">parcial</span>
                                )}

                                {e.pdfUrl ? (
                                    <a
                                        href={e.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded font-semibold"
                                    >
                                        ver PDF
                                    </a>
                                ) : (
                                    <button className="px-3 py-2 rounded border text-sm text-gray-500">Sin archivo</button>
                                )}

                                <button className="p-2 rounded border text-gray-500 hover:bg-gray-100">
                                    <Share2 size={16} />
                                </button>

                                <button className="p-2 rounded border text-gray-500 hover:bg-gray-100">
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
