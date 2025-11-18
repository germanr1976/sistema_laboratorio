"use client"
import { useEffect, useState } from 'react'
import { getPdf, deletePdf } from '../utils/estudiosStore'
import { Share2, Download } from 'lucide-react'
import { Trash2 } from 'lucide-react'

type UltimoCompletado = { id?: string; nombreApellido: string; dni: string; fecha: string; obraSocial: string; medico: string; pdfUrl?: string } | null

export default function Dashboard({ completados = 0, totales = 0, ultimoCompletado = null }: { completados?: number, totales?: number, ultimoCompletado?: UltimoCompletado }) {
  const [localCompletados, setLocalCompletados] = useState<number>(completados ?? 0)
  const [localTotales, setLocalTotales] = useState<number>(totales ?? 0)
  const [localParciales, setLocalParciales] = useState<number>(0)
  const [localUltimo, setLocalUltimo] = useState<UltimoCompletado>(ultimoCompletado ?? null)

  const [activeView, setActiveView] = useState<'none' | 'completados' | 'parciales' | 'todos'>('none')
  const [displayList, setDisplayList] = useState<Array<Record<string, any>>>([])
  const [listLoading, setListLoading] = useState<boolean>(false)

  // delete an estudio by id (remove metadata + PDF blob)
  // If id is not provided, try to match by nombreApellido + fecha + dni
  const handleDelete = async (id?: string, match?: { nombreApellido?: string; fecha?: string; dni?: string }) => {
    if (!id && !match) return
    try {
      // confirm
      // eslint-disable-next-line no-alert
      const ok = confirm('¿Eliminar estudio? Esta acción borrará el metadata y el PDF local.');
      if (!ok) return

      const raw = localStorage.getItem('estudios_metadata')
      const metas = raw ? JSON.parse(raw) as Array<Record<string, any>> : []
      let filtered
      if (id) {
        filtered = metas.filter(m => m.id !== id)
      } else {
        // match by nombreApellido + fecha + dni
        filtered = metas.filter(m => {
          if (!match) return true
          if (match.nombreApellido && m.nombreApellido !== match.nombreApellido) return true
          if (match.fecha && m.fecha !== match.fecha) return true
          if (match.dni && m.dni !== match.dni) return true
          // this is the item to remove -> filter it out
          return false
        })
      }
      localStorage.setItem('estudios_metadata', JSON.stringify(filtered))

      try {
        if (id) await deletePdf(id)
        else if (match) {
          // try to delete any blobs that match the metadata we removed
          const candidates = metas.filter(m => {
            if (match.nombreApellido && m.nombreApellido !== match.nombreApellido) return false
            if (match.fecha && m.fecha !== match.fecha) return false
            if (match.dni && m.dni !== match.dni) return false
            return !!m.id
          })
          for (const c of candidates) {
            try { await deletePdf(c.id) } catch (e) { /* ignore */ }
          }
        }
      } catch (e) {
        console.warn('[dashboard] no se pudo borrar blob en IndexedDB', e)
      }

      // update local counters and displayed list
      const tot = filtered.length
      const comp = filtered.filter(m => m.status === 'completado').length
      const parc = filtered.filter(m => m.status === 'parcial').length
      const last = filtered.filter(m => m.status === 'completado').slice(-1)[0] ?? null
      setLocalTotales(tot)
      setLocalCompletados(comp)
      setLocalParciales(parc)
      if (last) {
        setLocalUltimo({
          id: last.id ?? undefined,
          nombreApellido: last.nombreApellido ?? '',
          dni: last.dni ?? '',
          fecha: last.fecha ?? '',
          obraSocial: last.obraSocial ?? '',
          medico: last.medico ?? '',
          pdfUrl: last.pdfUrl ?? undefined,
        })
      } else {
        setLocalUltimo(null)
      }

      // remove from displayList if present
      setDisplayList(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error('[dashboard] error deleting estudio', e)
      // eslint-disable-next-line no-alert
      alert('No se pudo eliminar el estudio. Revisa la consola.')
    }
  }

  console.debug('[dashboard] render props', { completados, totales, ultimoCompletado, localCompletados, localTotales, localParciales, localUltimo })

  useEffect(() => {
    // If parent provided values, use them; otherwise load from localStorage
    const tryLoad = () => {
      try {
        const raw = localStorage.getItem('estudios_metadata')
        if (!raw) return
        const metas = JSON.parse(raw) as Array<Record<string, any>>
        const tot = metas.length
        const comp = metas.filter(m => m.status === 'completado').length
        const parc = metas.filter(m => m.status === 'parcial').length
        const last = metas.filter(m => m.status === 'completado').slice(-1)[0] ?? null
        setLocalTotales(tot)
        setLocalCompletados(comp)
        setLocalParciales(parc)
        if (last) {
          setLocalUltimo({
            nombreApellido: last.nombreApellido ?? '',
            dni: last.dni ?? '',
            fecha: last.fecha ?? '',
            obraSocial: last.obraSocial ?? '',
            medico: last.medico ?? '',
            pdfUrl: last.pdfUrl ?? undefined,
          })
        }
      } catch (e) {
        console.warn('[dashboard] could not read estudios_metadata from localStorage', e)
      }
    }

    // Prefer parent props when they are non-zero; otherwise read persisted data
    if ((completados ?? 0) > 0 || (totales ?? 0) > 0) {
      setLocalCompletados(completados ?? 0)
      setLocalTotales(totales ?? 0)
      setLocalUltimo(ultimoCompletado ?? null)
      // parent didn't provide partials count, leave localParciales as-is or zero
    } else {
      tryLoad()
    }
    // Always try to update parciales from storage because the parent doesn't provide it
    try {
      const rawPar = localStorage.getItem('estudios_metadata')
      if (rawPar) {
        const metasPar = JSON.parse(rawPar) as Array<Record<string, any>>
        const parc = metasPar.filter(m => m.status === 'parcial').length
        setLocalParciales(parc)
      }
    } catch (e) {
      console.warn('[dashboard] could not read parciales from localStorage', e)
    }
  }, [completados, totales, ultimoCompletado])

  // Load the list to display when the activeView changes
  useEffect(() => {
    let mounted = true
    async function loadList() {
      setListLoading(true)
      try {
        const raw = localStorage.getItem('estudios_metadata')
        if (!raw) {
          if (mounted) setDisplayList([])
          return
        }
        const metas = JSON.parse(raw) as Array<Record<string, any>>
        let filtered = metas
        if (activeView === 'completados') filtered = metas.filter(m => m.status === 'completado')
        else if (activeView === 'parciales') filtered = metas.filter(m => m.status === 'parcial')
        // dedupe by id
        const dedupMap: Record<string, any> = {}
        filtered.forEach(m => { if (m.id) dedupMap[m.id] = m })
        const deduped = Object.values(dedupMap)

        const resolved = await Promise.all(deduped.map(async (m) => {
          if (m.id && !m.pdfUrl) {
            try {
              const blob = await getPdf(m.id)
              if (blob) {
                const url = URL.createObjectURL(blob)
                return { ...m, pdfUrl: url }
              }
            } catch (e) {
              // ignore per-item errors
            }
          }
          return m
        }))

        if (mounted) setDisplayList(resolved)
      } catch (e) {
        console.error('[dashboard] error loading list', e)
        if (mounted) setDisplayList([])
      } finally {
        if (mounted) setListLoading(false)
      }
    }
    if (activeView !== 'none') loadList()
    else setDisplayList([])
    return () => { mounted = false }
  }, [activeView])
  return (
    <main className="flex-1 h-screen bg-white overflow-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Encabezado removido para evitar texto extra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Estudios Totales */}
          <div onClick={() => setActiveView(v => v === 'todos' ? 'none' : 'todos')} className="bg-blue-500 text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Estudios Totales</p>
                <p className="text-3xl font-bold">{localTotales}</p>
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* En Proceso */}
          <div className="bg-blue-500 text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">En Proceso</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* Completados */}
          <div onClick={() => setActiveView(v => v === 'completados' ? 'none' : 'completados')} className="bg-blue-500 text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Completados</p>
                <p className="text-3xl font-bold">{localCompletados}</p>
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          {/* Parcial */}
          <div onClick={() => setActiveView(v => v === 'parciales' ? 'none' : 'parciales')} className="bg-blue-500 text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Parcial</p>
                <p className="text-3xl font-bold">{localParciales}</p>
              </div>
              <div className="bg-blue-400 p-3 rounded-lg relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content Area */}
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center mt-8">
          {localUltimo ? (
            <div className="text-left max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <div className="font-bold text-gray-700 uppercase text-sm">{localUltimo.nombreApellido}</div>
                  <div className="text-xs text-gray-700">DNI: {localUltimo.dni}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Completado</span>
                  <button onClick={() => handleDelete(localUltimo?.id, { nombreApellido: localUltimo?.nombreApellido, fecha: localUltimo?.fecha, dni: localUltimo?.dni })} title="Eliminar estudio" className="p-2 rounded border text-gray-500 hover:bg-gray-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mb-4 text-gray-700 text-sm">
                <div>Fecha: {new Date(localUltimo.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                <div>Obra social: {localUltimo.obraSocial}</div>
                <div>Médico: {localUltimo.medico}</div>
              </div>
              {localUltimo.pdfUrl ? (
                <a href={localUltimo.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded transition-colors">Ver PDF</a>
              ) : null}
            </div>
          ) : (
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium">Área de contenido principal</p>
              <p className="text-sm">Aquí se mostrarán los estudios médicos y resultados</p>
            </div>
          )}
        </div>
        {/* Dynamic list area (completados / parciales) shown below when a tile is active */}
        {activeView !== 'none' && (
          <div className="mt-8">
            <h2 className="text-xl text-black font-bold mb-4">{activeView === 'completados' ? 'Estudios completados' : activeView === 'parciales' ? 'Estudios parciales' : 'Estudios'}</h2>
            {listLoading ? (
              <div>Cargando...</div>
            ) : displayList.length === 0 ? (
              <p className="text-gray-600">No hay estudios para mostrar.</p>
            ) : (
              <div className="space-y-4">
                {displayList.map((e) => (
                  <div key={e.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="font-bold text-gray-700">{e.nombreApellido}</div>
                      <div className="flex flex-wrap text-sm text-gray-600 gap-3">
                        <span>DNI {e.dni}</span>
                        <span>Fecha {e.fecha}</span>
                        <span>Obra social {e.obraSocial}</span>
                        <span>Médico: {e.medico}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {e.status === 'completado' && (
                        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">completado</span>
                      )}
                      {e.status === 'parcial' && (
                        <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full">parcial</span>
                      )}

                      {e.pdfUrl ? (
                        <a href={e.pdfUrl} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded font-semibold">ver PDF</a>
                      ) : (
                        <button className="px-3 py-2 rounded border text-sm text-gray-500">Sin archivo</button>
                      )}

                      <button className="p-2 rounded border text-gray-500 hover:bg-sky-500">
                        <Share2 size={16} />
                      </button>

                      <button className="p-2 rounded border text-gray-500 hover:bg-green-500">
                        <Download size={16} />
                      </button>

                      <button onClick={() => handleDelete(e.id)} title="Eliminar estudio" className="p-2 rounded border text-gray-500 hover:bg-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}