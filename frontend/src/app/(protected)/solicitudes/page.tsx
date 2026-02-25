"use client";

import { useEffect, useMemo, useState } from "react";
import authFetch from "../../../utils/authFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type StudyRequestStatus = "PENDING" | "VALIDATED" | "REJECTED" | "CONVERTED";

interface StudyRequestRow {
    id: number;
    dni: string;
    requestedDate: string;
    doctorName: string;
    insuranceName: string;
    medicalOrderPhotoUrl?: string | null;
    observations?: string | null;
    status: StudyRequestStatus;
    createdAt: string;
    validatedAt?: string | null;
    convertedStudyId?: number | null;
    patient?: {
        profile?: {
            firstName?: string | null;
            lastName?: string | null;
        } | null;
    } | null;
}

const statusLabel: Record<StudyRequestStatus, string> = {
    PENDING: "Pendiente",
    VALIDATED: "Validada",
    REJECTED: "Rechazada",
    CONVERTED: "Convertida",
};

const statusClass: Record<StudyRequestStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    VALIDATED: "bg-blue-100 text-blue-800 border-blue-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    CONVERTED: "bg-green-100 text-green-800 border-green-200",
};

export default function SolicitudesPage() {
    const AUTO_REFRESH_MS = 45000;
    const [dniFilter, setDniFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | StudyRequestStatus>("PENDING");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<StudyRequestRow[]>([]);
    const [actingId, setActingId] = useState<number | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
    const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [convertTargetId, setConvertTargetId] = useState<number | null>(null);

    const resolveOrderUrl = (value?: string | null) => {
        if (!value) return null;
        return value.startsWith("http") ? value : `${API_URL}${value}`;
    };

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (dniFilter.trim()) params.set("dni", dniFilter.trim());
        if (statusFilter !== "all") params.set("status", statusFilter);
        const qs = params.toString();
        return qs ? `?${qs}` : "";
    }, [dniFilter, statusFilter]);

    const loadRows = async (showSpinner = true) => {
        try {
            if (showSpinner) {
                setLoading(true);
            }
            const response = await authFetch(`${API_URL}/api/study-requests${queryString}`);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setRows([]);
                setError(data?.message || "No se pudieron cargar las solicitudes");
                return;
            }

            const items = Array.isArray(data?.data) ? data.data : [];
            setRows(items);
            setError(null);
            setLastUpdatedAt(new Date());
        } catch (e) {
            console.error(e);
            setRows([]);
            setError("Error al conectar con el servidor");
        } finally {
            if (showSpinner) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadRows(true);
    }, [queryString]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            if (actingId !== null || rejectTargetId !== null || convertTargetId !== null) {
                return;
            }
            loadRows(false);
        }, AUTO_REFRESH_MS);

        return () => window.clearInterval(intervalId);
    }, [queryString, actingId, rejectTargetId, convertTargetId]);

    const runAction = async (
        id: number,
        action: "validate" | "reject" | "convert",
        payload?: { observations?: string | null }
    ) => {
        try {
            setActingId(id);

            let url = `${API_URL}/api/study-requests/${id}`;
            let method: "PATCH" | "POST" = "PATCH";
            let body: any = undefined;

            if (action === "validate") {
                url += "/validate";
            } else if (action === "reject") {
                url += "/reject";
                body = JSON.stringify({ observations: payload?.observations ?? null });
            } else {
                url += "/convert";
                method = "POST";
            }

            const response = await authFetch(url, {
                method,
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body,
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data?.message || "No se pudo ejecutar la acción");
                return;
            }

            await loadRows();
            setError(null);
        } catch (e) {
            console.error(e);
            setError("Error al conectar con el servidor");
        } finally {
            setActingId(null);
        }
    };

    const openRejectModal = (id: number) => {
        setRejectTargetId(id);
        setRejectReason("");
    };

    const closeRejectModal = () => {
        if (actingId) return;
        setRejectTargetId(null);
        setRejectReason("");
    };

    const confirmReject = async () => {
        if (!rejectTargetId) return;
        await runAction(rejectTargetId, "reject", {
            observations: rejectReason.trim() || null,
        });
        setRejectTargetId(null);
        setRejectReason("");
    };

    const openConvertModal = (id: number) => {
        setConvertTargetId(id);
    };

    const closeConvertModal = () => {
        if (actingId) return;
        setConvertTargetId(null);
    };

    const confirmConvert = async () => {
        if (!convertTargetId) return;
        await runAction(convertTargetId, "convert");
        setConvertTargetId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Solicitudes de Estudio</h1>
                    <p className="text-gray-600">Revisá solicitudes de pacientes y convertí a estudios cuando corresponda.</p>
                    <p className="text-xs text-gray-500">
                        Última actualización: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString("es-AR") : "—"}
                    </p>
                </div>

                <section className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por DNI</label>
                            <input
                                type="text"
                                value={dniFilter}
                                onChange={(e) => setDniFilter(e.target.value.replace(/\D/g, ""))}
                                placeholder="Ej: 30123456"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as "all" | StudyRequestStatus)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos</option>
                                <option value="PENDING">Pendiente</option>
                                <option value="VALIDATED">Validada</option>
                                <option value="REJECTED">Rechazada</option>
                                <option value="CONVERTED">Convertida</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => loadRows(true)}
                                className="w-full md:w-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Recargar
                            </button>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <section className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
                    {loading ? (
                        <div className="p-6 text-sm text-gray-600">Cargando solicitudes...</div>
                    ) : rows.length === 0 ? (
                        <div className="p-6 text-sm text-gray-600">No hay solicitudes para los filtros seleccionados.</div>
                    ) : (
                        <table className="w-full text-sm table-auto">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">DNI</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Paciente</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Fecha</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Médico</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Obra social</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Estado</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Orden</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {rows.map((row) => {
                                    const patientName = `${row.patient?.profile?.firstName || ""} ${row.patient?.profile?.lastName || ""}`.trim() || "-";
                                    const disabled = actingId === row.id;

                                    return (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2 text-gray-900">{row.dni}</td>
                                            <td className="px-3 py-2 text-gray-900">{patientName}</td>
                                            <td className="px-3 py-2 text-gray-900">{new Date(row.requestedDate).toLocaleDateString("es-AR")}</td>
                                            <td className="px-3 py-2 text-gray-900">{row.doctorName}</td>
                                            <td className="px-3 py-2 text-gray-900">{row.insuranceName}</td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass[row.status]}`}>
                                                    {statusLabel[row.status]}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                {resolveOrderUrl(row.medicalOrderPhotoUrl) ? (
                                                    <a
                                                        href={resolveOrderUrl(row.medicalOrderPhotoUrl)!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        Ver orden
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex justify-end gap-2">
                                                    {row.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                onClick={() => runAction(row.id, "validate")}
                                                                className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                                            >
                                                                Validar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                onClick={() => openRejectModal(row.id)}
                                                                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === "VALIDATED" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                onClick={() => openConvertModal(row.id)}
                                                                className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                                            >
                                                                Convertir
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                onClick={() => openRejectModal(row.id)}
                                                                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === "CONVERTED" && row.convertedStudyId ? (
                                                        <span className="text-xs text-green-700">Estudio #{row.convertedStudyId}</span>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>

            {rejectTargetId !== null && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-lg bg-white border border-gray-200 shadow-lg p-5 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Rechazar solicitud</h2>
                        <p className="text-sm text-gray-600">Podés indicar un motivo para dejar trazabilidad.</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            placeholder="Motivo de rechazo (opcional)"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={actingId === rejectTargetId}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeRejectModal}
                                disabled={actingId === rejectTargetId}
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmReject}
                                disabled={actingId === rejectTargetId}
                                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {actingId === rejectTargetId ? "Rechazando..." : "Confirmar rechazo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {convertTargetId !== null && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-lg bg-white border border-gray-200 shadow-lg p-5 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Convertir a estudio</h2>
                        <p className="text-sm text-gray-600">
                            Esta acción crea un estudio clínico oficial a partir de la solicitud validada.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeConvertModal}
                                disabled={actingId === convertTargetId}
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmConvert}
                                disabled={actingId === convertTargetId}
                                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                            >
                                {actingId === convertTargetId ? "Convirtiendo..." : "Confirmar conversión"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
