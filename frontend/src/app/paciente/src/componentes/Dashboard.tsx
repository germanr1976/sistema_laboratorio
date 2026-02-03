"use client"

import { useEffect, useState } from "react"
import { getPdf, deletePdf } from "../utils/estudiosStore"
import { Trash2 } from "lucide-react"

// Simple authFetch implementation using fetch and localStorage token
async function authFetch(input: RequestInfo, init?: RequestInit) {
  const token = localStorage.getItem('token')
  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  })
}

type UltimoCompletado = {
  id?: string
  nombreApellido: string
  dni: string
  fecha: string
  obraSocial: string
  medico: string
  pdfUrl?: string
} | null

export default function Dashboard({
  completados = 0,
  totales = 0,
  ultimoCompletado = null,
}: {
  completados?: number
  totales?: number
  ultimoCompletado?: UltimoCompletado
}) {
  const [localCompletados, setLocalCompletados] = useState(completados)
  const [localTotales, setLocalTotales] = useState(totales)
  const [localParciales, setLocalParciales] = useState(0)
  const [localUltimo, setLocalUltimo] = useState<UltimoCompletado>(ultimoCompletado)

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    const loadStudies = async () => {
      try {
        const response = await authFetch('http://localhost:3000/api/studies/patient/me')
        if (!response.ok) {
          console.error('Error fetching studies:', response.statusText)
          return
        }
        const result = await response.json()
        const studies = result.data || []

        setLocalTotales(studies.length)
        setLocalCompletados(studies.filter((s: any) => s.status?.name === "COMPLETED").length)
        setLocalParciales(studies.filter((s: any) => s.status?.name === "PARTIAL").length)

        const lastCompleted = studies.filter((s: any) => s.status?.name === "COMPLETED").slice(-1)[0]
        if (lastCompleted) {
          setLocalUltimo({
            id: lastCompleted.id?.toString(),
            nombreApellido: `${lastCompleted.patient?.profile?.firstName} ${lastCompleted.patient?.profile?.lastName}`,
            dni: lastCompleted.patient?.dni || '',
            fecha: new Date(lastCompleted.studyDate).toLocaleDateString('es-ES'),
            obraSocial: lastCompleted.socialInsurance || '',
            medico: lastCompleted.biochemist ? `${lastCompleted.biochemist.profile?.firstName} ${lastCompleted.biochemist.profile?.lastName}` : '',
            pdfUrl: lastCompleted.pdfUrl ? `http://localhost:3000${lastCompleted.pdfUrl}` : undefined
          })
        }
      } catch (e) {
        console.error('Error loading studies:', e)
      }
    }
    loadStudies()
  }, [])

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id?: string) => {
    if (!id) return
    const ok = confirm("¿Eliminar estudio?")
    if (!ok) return

    const raw = localStorage.getItem("estudios_metadata")
    const metas = raw ? JSON.parse(raw) : []
    const filtered = metas.filter((m: any) => m.id !== id)

    localStorage.setItem("estudios_metadata", JSON.stringify(filtered))
    await deletePdf(id)

    setLocalTotales(filtered.length)
    setLocalCompletados(filtered.filter((m: any) => m.status === "completado").length)
    setLocalParciales(filtered.filter((m: any) => m.status === "parcial").length)
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* TITLE */}
        <h1 className="text-gray-900 text-lg font-medium mb-6">
          Aquí puedes ver tus estudios médicos y resultados
        </h1>

        {/* STATS (NO TOCADAS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Estudios Totales", value: localTotales, icon: "📄" },
            { label: "En Proceso", value: 0, icon: "🕒" },
            { label: "Completados", value: localCompletados, icon: "✔️" },
            { label: "Parcial", value: localParciales, icon: "⛔" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-blue-500 text-white p-5 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="text-sm">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
              <span className="text-xl">{s.icon}</span>
            </div>
          ))}
        </div>

        {/* RECENT STUDIES */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Estudios recientes
          </h2>

          {localUltimo ? (
            <div className="divide-y">

              {/* COMPLETADO */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-4">
                <div>
                  <p className="font-semibold text-gray-900">
                  Matias Der
                  </p>
                  <p className="text-sm text-gray-700">
                    DNI {localUltimo.dni}
                  </p>
                  <p className="text-xs text-gray-600">
                    Hace un momento
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs bg-green-500 text-white min-w-[95px] text-center">
                  Completado
                </span>

                {localUltimo.pdfUrl ? (
                  <a
                    href={localUltimo.pdfUrl}
                    target="_blank"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm min-w-[90px] text-center"
                  >
                    Ver PDF
                  </a>
                ) : (
                  <span className="text-sm text-gray-600">
                    Procesando…
                  </span>
                )}

                <button
                  onClick={() => handleDelete(localUltimo.id)}
                  className="text-gray-600 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

            

            

            </div>
          ) : (
            <p className="text-gray-700 text-sm">
              No hay estudios recientes.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}


