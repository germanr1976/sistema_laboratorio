"use client"
import { useEffect, useRef, useState } from 'react'
import { getPdf, deletePdf } from '../utils/estudiosStore'
import { Share2, Download, Trash2 } from 'lucide-react'
import {
  cardClasses,
  leftColClasses,
  nameClasses,
  metaClasses,
  rightActionsClasses,
  btnPdf,
  btnNoFile,
  iconBtn,
  badgeCompletado,
  badgeParcial,
  badgeEnProceso,
} from '../utils/uiClasses'
import Toast from './Toast'
type UltimoCompletado = { id?: string; nombreApellido: string; dni: string; fecha: string; obraSocial: string; medico: string; pdfUrl?: string } | null

function PatientForm({ onSaved }: { onSaved?: () => void }) {
  const [nombreApellido, setNombreApellido] = useState<string>('')
  const [dni, setDni] = useState<string>('')
  const [fecha, setFecha] = useState<string>('')
  const [obraSocial, setObraSocial] = useState<string>('')
  const [medico, setMedico] = useState<string>('')

  const handleSave = () => {
    if (!nombreApellido || !dni || !fecha) {
      alert('Complete al menos nombre, DNI y fecha')
      return
    }
    const id = `estudio_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    try {
      const raw = localStorage.getItem('estudios_metadata')
      const metas = raw ? JSON.parse(raw) as Array<any> : []
      metas.push({ id, nombreApellido, dni, fecha, obraSocial, medico, status: 'en_proceso' })
      localStorage.setItem('estudios_metadata', JSON.stringify(metas))
    } catch (e) {
      console.warn('[PatientForm] error saving metadata', e)
    }
    if (onSaved) onSaved()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre y apellido</label>
        <input value={nombreApellido} onChange={(e) => setNombreApellido(e.target.value)} className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white text-black placeholder-gray-500" />
      </div>
      <div>
        <label className="text-sm font-medium">DNI</label>
        <input value={dni} onChange={(e) => setDni(e.target.value)} className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white text-black placeholder-gray-500" />
      </div>
      <div>
        <label className="text-sm font-medium">Fecha</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white text-black placeholder-gray-500" />
      </div>
      <div>
        <label className="text-sm font-medium">Obra social</label>
        <input value={obraSocial} onChange={(e) => setObraSocial(e.target.value)} className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white text-black placeholder-gray-500" />
      </div>
      <div>
        <label className="text-sm font-medium">Médico</label>
        <input value={medico} onChange={(e) => setMedico(e.target.value)} className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-white text-black placeholder-gray-500" />
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={handleSave} className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500">En Proceso</button>
      </div>
    </div>
  )
}
export default function Dashboard({ completados = 0, totales = 0, ultimoCompletado = null }: { completados?: number, totales?: number, ultimoCompletado?: UltimoCompletado }) {
  const [localCompletados, setLocalCompletados] = useState<number>(completados ?? 0)
  const [localTotales, setLocalTotales] = useState<number>(totales ?? 0)
  const [localParciales, setLocalParciales] = useState<number>(0)
  const [localUltimo, setLocalUltimo] = useState<UltimoCompletado>(ultimoCompletado ?? null)
  const [localEnProceso, setLocalEnProceso] = useState<number>(0)
  const [showPatientModal, setShowPatientModal] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)

  const [activeView, setActiveView] = useState<'none' | 'completados' | 'parciales' | 'todos' | 'en_proceso'>('none')
  const [displayList, setDisplayList] = useState<Array<Record<string, any>>>([])
  const [listLoading, setListLoading] = useState<boolean>(false)
  const [recentStudies, setRecentStudies] = useState<Array<Record<string, any>>>([])
  const [recentLoading, setRecentLoading] = useState<boolean>(false)
  const recentUrlsRef = useRef<string[]>([])


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

      // revoke any object URL we may have created for the deleted estudio to avoid stale previews
      try {
        if (id && localUltimo && localUltimo.pdfUrl) {
          try { URL.revokeObjectURL(localUltimo.pdfUrl) } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }

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
        const proceso = metas.filter(m => m.status === 'en_proceso').length
        const last = metas.filter(m => m.status === 'completado').slice(-1)[0] ?? null
        setLocalTotales(tot)
        setLocalCompletados(comp)
        setLocalParciales(parc)
        setLocalEnProceso(proceso)
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
        }
        // Recent studies removed per UX change — no-op
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
        const proceso = metasPar.filter(m => m.status === 'en_proceso').length
        setLocalEnProceso(proceso)
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
        else if (activeView === 'en_proceso') filtered = metas.filter(m => m.status === 'en_proceso')
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
          <div onClick={() => setActiveView(v => v === 'todos' ? 'none' : 'todos')} className={`${activeView === 'todos' ? 'bg-blue-700 ring-2 ring-blue-300' : 'bg-blue-500'} text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Estudios Totales</p>
                <p className="text-3xl font-bold">{localTotales}</p>
              </div>
              <div className={`${activeView === 'todos' ? 'bg-blue-600' : 'bg-blue-400'} p-3 rounded-lg`}>
                <svg className={`${activeView === 'todos' ? 'text-white' : 'text-blue-900'} w-6 h-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div onClick={() => setActiveView(v => v === 'en_proceso' ? 'none' : 'en_proceso')} className={`${activeView === 'en_proceso' ? 'bg-blue-700 ring-2 ring-blue-300' : 'bg-blue-500'} text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">En Proceso</p>
                <p className="text-3xl font-bold">{localEnProceso}</p>
              </div>
              <div className={`${activeView === 'en_proceso' ? 'bg-blue-600' : 'bg-blue-400'} p-3 rounded-lg`}>
                <svg className={`${activeView === 'en_proceso' ? 'text-white' : 'text-blue-900'} w-6 h-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div onClick={() => setActiveView(v => v === 'completados' ? 'none' : 'completados')} className={`${activeView === 'completados' ? 'bg-blue-700 ring-2 ring-blue-300' : 'bg-blue-500'} text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Completados</p>
                <p className="text-3xl font-bold">{localCompletados}</p>
              </div>
              <div className={`${activeView === 'completados' ? 'bg-blue-600' : 'bg-blue-400'} p-3 rounded-lg`}>
                <svg className={`${activeView === 'completados' ? 'text-white' : 'text-blue-900'} w-6 h-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          {/* Parcial */}
          <div onClick={() => setActiveView(v => v === 'parciales' ? 'none' : 'parciales')} className={`${activeView === 'parciales' ? 'bg-blue-700 ring-2 ring-blue-300' : 'bg-blue-500'} text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Parcial</p>
                <p className="text-3xl font-bold">{localParciales}</p>
              </div>
              <div className={`${activeView === 'parciales' ? 'bg-blue-600' : 'bg-blue-400'} p-3 rounded-lg relative`}>
                <svg className={`${activeView === 'parciales' ? 'text-white' : 'text-blue-900'} w-6 h-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex justify-end mt-4">
          <button onClick={() => setShowPatientModal(true)} className="px-4 py-2 bg-yellow-400 text-black rounded-lg shadow-sm hover:bg-yellow-500">Cargar nuevo</button>
        </div>


        {/* Dynamic list area (completados / parciales) shown below when a tile is active */}
        {activeView !== 'none' && (
          <div className="mt-8">
            <h2 className="text-xl text-black font-bold mb-4">{activeView === 'completados' ? 'Estudios completados' : activeView === 'parciales' ? 'Estudios parciales' : activeView === 'en_proceso' ? 'Estudios en proceso' : 'Estudios'}</h2>
            {listLoading ? (
              <div>Cargando...</div>
            ) : displayList.length === 0 ? (
              <p className="text-gray-600">No hay estudios para mostrar.</p>
            ) : (
              <div className="space-y-4">
                {displayList.map((e) => (
                  <div key={e.id} className={cardClasses}>
                    <div className={`${leftColClasses} flex flex-col gap-1`}>
                      <div className={nameClasses}>{e.nombreApellido}</div>
                      <div className={metaClasses}>
                        <span>DNI {e.dni}</span>
                        <span>Fecha {e.fecha}</span>
                        <span>Obra social {e.obraSocial}</span>
                        <span>Médico: {e.medico}</span>
                      </div>
                    </div>

                    <div className={rightActionsClasses}>
                      {e.status === 'completado' && (
                        <span className={badgeCompletado}>completado</span>
                      )}
                      {e.status === 'parcial' && (
                        <span className={badgeParcial}>parcial</span>
                      )}

                      {(e.status === 'en_proceso' || e.status === 'en proceso') && (
                        <span className={badgeEnProceso}>en proceso</span>
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
        )}
      </div>
      {showPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 font-semibold">Cargar nuevo paciente (precarga)</h3>
              <button onClick={() => setShowPatientModal(false)} className="text-gray-500 hover:text-gray-700">Cerrar</button>
            </div>
            <PatientForm onSaved={() => {
              // refresh counts and close modal
              try { const raw = localStorage.getItem('estudios_metadata'); const metas = raw ? JSON.parse(raw) as Array<any> : []; setLocalTotales(metas.length); setLocalEnProceso(metas.filter(m => m.status === 'en_proceso').length); setLocalParciales(metas.filter(m => m.status === 'parcial').length); } catch (e) {/*ignore*/ }
              setShowPatientModal(false)
              // show toast
              setToastMessage('Precarga creada')
              setShowToast(true)
              try { window.setTimeout(() => setShowToast(false), 3000) } catch (e) { /* ignore */ }
            }} />
          </div>
        </div>
      )}
      <Toast message={toastMessage} type="success" show={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}

