"use client"

import { useEffect, useState } from "react"
import { Search, FileText, Calendar } from "lucide-react"
import { StudiesTable } from "../../../componentes/Historial-Fecha"
import Toast from "../../../componentes/Toast"
import { cancelStudy, getMyStudies } from "../../../utils/studiesApi"
import type { Study } from "../../../utils/tipos"

export default function LabHistoryPage() {
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [statusFilter, setStatusFilter] = useState<"todos" | Study["status"]>("todos")
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
    const [allStudies, setAllStudies] = useState<Study[]>([])
    const [filteredStudies, setFilteredStudies] = useState<Study[]>([])
    const [loading, setLoading] = useState(true)
    const [cancellingStudyId, setCancellingStudyId] = useState<string | null>(null)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState("")
    const [toastType, setToastType] = useState<"success" | "error" | "info">("info")

    const mapStatus = (statusName?: string) => {
        if (statusName === "COMPLETED") return "Completado"
        if (statusName === "PARTIAL") return "Parcial"
        if (statusName === "CANCELLED") return "Anulado"
        return "En Proceso"
    }

    const sortStudiesByDate = (studies: Study[], order: "desc" | "asc") => {
        return [...studies].sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()

            if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0
            if (Number.isNaN(dateA)) return 1
            if (Number.isNaN(dateB)) return -1

            return order === "desc" ? dateB - dateA : dateA - dateB
        })
    }

    const applyFilters = (
        studies: Study[],
        status: "todos" | Study["status"],
        order: "desc" | "asc",
        start: string,
        end: string
    ) => {
        const filteredByStatus = status === "todos"
            ? studies
            : studies.filter((study) => study.status === status)

        const filteredByDate = filteredByStatus.filter((study) => {
            if (!start && !end) return true

            const studyDate = new Date(study.date)
            const startDateObj = start ? new Date(start) : null
            const endDateObj = end ? new Date(end) : null

            if (startDateObj && endDateObj) {
                return studyDate >= startDateObj && studyDate <= endDateObj
            }
            if (startDateObj) {
                return studyDate >= startDateObj
            }
            if (endDateObj) {
                return studyDate <= endDateObj
            }
            return true
        })

        return sortStudiesByDate(filteredByDate, order)
    }

    const showToastMessage = (message: string, type: "success" | "error" | "info" = "info") => {
        setToastMessage(message)
        setToastType(type)
        setShowToast(true)
    }

    const loadStudies = async (order: "desc" | "asc" = sortOrder) => {
        try {
            setLoading(true)
            const studies = await getMyStudies()

            const transformedStudies: Study[] = studies.map((s: any) => {
                const patientName = (
                    s.patient?.fullName ||
                    `${s.patient?.profile?.firstName || ""} ${s.patient?.profile?.lastName || ""}`
                ).trim()

                const attachmentUrls = Array.isArray(s.attachments)
                    ? s.attachments.map((a: any) => a?.url).filter(Boolean)
                    : []
                const rawPdfs = attachmentUrls.length > 0
                    ? attachmentUrls
                    : (Array.isArray(s.pdfs) ? s.pdfs : (s.pdfUrl ? [s.pdfUrl] : []))

                const pdfLinks = rawPdfs
                    .map((p: string) => (p?.startsWith("http") ? p : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${p}`))
                    .filter(Boolean)

                return {
                    id: String(s.id),
                    patientName: patientName || "Paciente sin nombre",
                    dni: s.patient?.dni || "-",
                    obraSocial: s.socialInsurance || "Sin obra social",
                    date: s.studyDate || s.createdAt,
                    status: mapStatus(s.status?.name),
                    doctor: s.doctor || "Sin asignar",
                    pdfUrl: pdfLinks[0],
                    pdfs: pdfLinks,
                }
            })

            const sortedStudies = sortStudiesByDate(transformedStudies, order)
            setAllStudies(sortedStudies)
            setFilteredStudies(applyFilters(sortedStudies, statusFilter, order, startDate, endDate))
        } catch (error: any) {
            console.error("Error cargando historial profesional:", error)
            showToastMessage(error.message || "No se pudieron cargar los estudios", "error")
            setAllStudies([])
            setFilteredStudies([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStudies()
    }, [])

    const handleSearch = () => {
        setFilteredStudies(applyFilters(allStudies, statusFilter, sortOrder, startDate, endDate))
    }

    const handleClear = () => {
        setStartDate("")
        setEndDate("")
        setStatusFilter("todos")
        setFilteredStudies(sortStudiesByDate(allStudies, sortOrder))
    }

    const handleSortChange = (newOrder: "desc" | "asc") => {
        setSortOrder(newOrder)
        setFilteredStudies(applyFilters(allStudies, statusFilter, newOrder, startDate, endDate))
    }

    const handleStatusFilterChange = (newStatus: "todos" | Study["status"]) => {
        setStatusFilter(newStatus)
        setFilteredStudies(applyFilters(allStudies, newStatus, sortOrder, startDate, endDate))
    }

    const handleCancelStudy = async (studyId: string) => {
        const confirmed = window.confirm("¿Querés anular este estudio?")
        if (!confirmed) return

        try {
            setCancellingStudyId(studyId)
            showToastMessage("Anulando estudio...", "info")

            const numericStudyId = Number(studyId)
            if (!Number.isFinite(numericStudyId)) {
                throw new Error("ID de estudio inválido para anulación")
            }

            await cancelStudy(numericStudyId)
            showToastMessage("Estudio anulado exitosamente", "success")
            await loadStudies(sortOrder)
        } catch (error: any) {
            console.error("Error anulando estudio:", error)
            showToastMessage(error.message || "Error al anular el estudio", "error")
        } finally {
            setCancellingStudyId(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Historial de Estudios de Laboratorio</h1>
                    <p className="text-gray-600">Busca y consulta los estudios realizados por rango de fechas</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-gray-600">Cargando historial...</p>
                    </div>
                ) : (
                    <>

                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-5 py-4">
                                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                    <Calendar className="h-5 w-5" />
                                    Búsqueda
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">Selecciona un rango de fechas para ver los estudios</p>
                            </div>
                            <div className="px-5 py-4">
                                <div className="space-y-4">
                                    <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
                                        <div className="space-y-2 lg:col-span-4">
                                            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                                                Fecha Desde
                                            </label>
                                            <input
                                                id="start-date"
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2 lg:col-span-4">
                                            <label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                                                Fecha Hasta
                                            </label>
                                            <input
                                                id="end-date"
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="lg:col-span-4">
                                            <p className="mb-1.5 text-sm font-medium text-gray-700">Estado</p>
                                            <div className="flex flex-wrap gap-2">
                                                {([
                                                    "todos",
                                                    "En Proceso",
                                                    "Parcial",
                                                    "Completado",
                                                    "Anulado",
                                                ] as const).map((statusOption) => {
                                                    const isActive = statusFilter === statusOption
                                                    return (
                                                        <button
                                                            key={statusOption}
                                                            type="button"
                                                            onClick={() => handleStatusFilterChange(statusOption)}
                                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${isActive
                                                                ? "border-blue-600 bg-blue-600 text-white"
                                                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            {statusOption === "todos" ? "Todos" : statusOption}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-end gap-2">
                                        <button
                                            onClick={handleSearch}
                                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            <Search className="h-4 w-4" />
                                            Buscar
                                        </button>
                                        <button
                                            onClick={handleClear}
                                            className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                                    <div>
                                        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                            <FileText className="h-5 w-5" />
                                            Resultados
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">Se encontraron {filteredStudies.length} estudios</p>
                                    </div>
                                    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                                        <label htmlFor="sort-order" className="text-sm font-medium text-gray-700">
                                            Ordenar:
                                        </label>
                                        <select
                                            id="sort-order"
                                            value={sortOrder}
                                            onChange={(e) => handleSortChange(e.target.value as "desc" | "asc")}
                                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="desc">Más recientes</option>
                                            <option value="asc">Más antiguos</option>
                                        </select>
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                                            Total: {filteredStudies.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <StudiesTable
                                    studies={filteredStudies}
                                    onCancelStudy={handleCancelStudy}
                                    cancellingStudyId={cancellingStudyId}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
