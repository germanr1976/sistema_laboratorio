"use client"
import { useEffect, useState } from 'react'

type UltimoCompletado = { nombreApellido: string; dni: string; fecha: string; obraSocial: string; medico: string; pdfUrl?: string } | null

export default function Dashboard({ completados = 0, totales = 0, ultimoCompletado = null }: { completados?: number, totales?: number, ultimoCompletado?: UltimoCompletado }) {
  const [localCompletados, setLocalCompletados] = useState<number>(completados ?? 0)
  const [localTotales, setLocalTotales] = useState<number>(totales ?? 0)
  const [localUltimo, setLocalUltimo] = useState<UltimoCompletado>(ultimoCompletado ?? null)

  console.debug('[dashboard] render props', { completados, totales, ultimoCompletado, localCompletados, localTotales })

  useEffect(() => {
    // If parent provided values, use them; otherwise load from localStorage
    const tryLoad = () => {
      try {
        const raw = localStorage.getItem('estudios_metadata')
        if (!raw) return
        const metas = JSON.parse(raw) as Array<Record<string, any>>
        const tot = metas.length
        const comp = metas.filter(m => m.status === 'completado').length
        const last = metas.filter(m => m.status === 'completado').slice(-1)[0] ?? null
        setLocalTotales(tot)
        setLocalCompletados(comp)
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
    } else {
      tryLoad()
    }
  }, [completados, totales, ultimoCompletado])
  return (
    <main className="flex-1 h-screen bg-white overflow-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Encabezado removido para evitar texto extra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Estudios Totales */}
          <div className="bg-blue-500 text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Estudios Totales</p>
                <p className="text-3xl font-bold">{totales}</p>
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
          <div className="bg-blue-500 text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Completados</p>
                <p className="text-3xl font-bold">{completados}</p>
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          {/* Parcial */}
          <div className="bg-blue-500 text-white p-8 rounded-xl shadow-md transition-transform duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Parcial</p>
                <p className="text-3xl font-bold">1</p>
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
          {ultimoCompletado ? (
            <div className="text-left max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <div className="font-bold uppercase text-sm">{ultimoCompletado.nombreApellido}</div>
                  <div className="text-xs text-gray-600">DNI: {ultimoCompletado.dni}</div>
                </div>
                <span className="inline-block bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Completado</span>
              </div>
              <div className="flex flex-wrap gap-6 mb-4 text-sm">
                <div>Fecha: {new Date(ultimoCompletado.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                <div>Obra social: {ultimoCompletado.obraSocial}</div>
                <div>Médico: {ultimoCompletado.medico}</div>
              </div>
              {ultimoCompletado.pdfUrl ? (
                <a href={ultimoCompletado.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded transition-colors">Ver PDF</a>
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
      </div>
    </main>
  );
}