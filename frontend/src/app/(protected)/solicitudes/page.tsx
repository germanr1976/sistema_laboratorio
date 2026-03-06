"use client";

import { useEffect, useMemo, useState } from "react";
import authFetch from "../../../utils/authFetch";
import RequestDetail from './_requestDetail';

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
    PENDING: "En proceso",
    VALIDATED: "Validada",
    REJECTED: "Rechazada",
    CONVERTED: "En proceso",
};

const statusClass: Record<StudyRequestStatus, string> = {
    PENDING: "bg-blue-100 text-blue-800 border-blue-200",
    VALIDATED: "bg-blue-100 text-blue-800 border-blue-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    CONVERTED: "bg-blue-100 text-blue-800 border-blue-200",
};

const formatDateOnly = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString("es-AR", { timeZone: "UTC" });
};

export default function SolicitudesPage() {
    const AUTO_REFRESH_MS = 45000;
    const [dniFilter, setDniFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<StudyRequestRow[]>([]);
    const [actingId, setActingId] = useState<number | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
    const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    // ya no se usa convertTargetId

    const resolveOrderUrl = (value?: string | null) => {
        if (!value) return null;
        return value.startsWith("http") ? value : `${API_URL}${value}`;
    };

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (dniFilter.trim()) params.set("dni", dniFilter.trim());
        params.set("status", "PENDING");
        const qs = params.toString();
        return qs ? `?${qs}` : "";
    }, [dniFilter]);

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
                return [];
            }

            const items = Array.isArray(data?.data) ? data.data : [];
            setRows(items);
            setError(null);
            setLastUpdatedAt(new Date());
            return items;
        } catch (e) {
            console.error(e);
            setRows([]);
            setError("Error al conectar con el servidor");
            return [];
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
            if (actingId !== null || rejectTargetId !== null) {
                return;
            }
            loadRows(false);
        }, AUTO_REFRESH_MS);

        return () => window.clearInterval(intervalId);
    }, [queryString, actingId, rejectTargetId]);

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
                // Conflict errors suelen indicar double-convert; ignorar silenciosamente
                if (response.status === 409 && action === 'convert') {
                    console.warn('acción convert conflict, ya estaba en proceso');
                    return null;
                }
                setError(data?.message || "No se pudo ejecutar la acción");
                return null;
            }

            await loadRows();
            setError(null);
            // Devolver payload para que el caller pueda extraer convertedStudyId/studyId sin depender del listado filtrado.
            return data?.data || data || null;
        } catch (e) {
            console.error(e);
            setError("Error al conectar con el servidor");
            return null;
        } finally {
            setActingId(null);
        }
    };

    const [selectedRequest, setSelectedRequest] = useState<StudyRequestRow | null>(null);
    const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
    const [loadingStudy, setLoadingStudy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const extractStudyIdFromPayload = (payload: any): number | null => {
        if (!payload) return null;

        const candidates = [
            payload?.convertedStudyId,
            payload?.convertedStudy?.id,
            payload?.studyId,
            payload?.study?.id,
            payload?.id,
            payload?.data?.convertedStudyId,
            payload?.data?.convertedStudy?.id,
            payload?.data?.studyId,
            payload?.data?.study?.id,
            payload?.data?.id,
        ];

        for (const candidate of candidates) {
            const n = Number(candidate);
            if (Number.isFinite(n) && n > 0) return n;
        }
        return null;
    };

    const fetchRequestById = async (requestId: number) => {
        try {
            const resp = await authFetch(`${API_URL}/api/study-requests/${requestId}`);
            const j = await resp.json().catch(() => ({}));
            if (!resp.ok) return null;
            return j?.data || j || null;
        } catch (e) {
            console.warn('[fetchRequestById] No se pudo obtener solicitud por id:', e);
            return null;
        }
    };

    const openRequestDetail = async (row: StudyRequestRow) => {
        setSelectedRequest(null);
        setSelectedStudy(null);
        setError(null);

        console.log('[openRequestDetail] Abriendo solicitud:', { id: row.id, status: row.status, convertedStudyId: row.convertedStudyId });

        // Si ya existe un estudio asociado, mostrarlo inmediatamente
        if (row.convertedStudyId) {
            console.log('[openRequestDetail] Estudio ya existe:', row.convertedStudyId);
            setSelectedRequest(row);
            await fetchStudy(row.convertedStudyId);
            return;
        }

        // Si no hay estudio aún, validar y convertir automáticamente
        if (row.status === 'PENDING' || row.status === 'VALIDATED') {
            try {
                setActingId(row.id);
                console.log('[openRequestDetail] Iniciando validación/conversión');

                // Si es PENDING, validar primero. Si no devuelve studyId, intentar convertir.
                if (row.status === 'PENDING') {
                    console.log('[openRequestDetail] Estado PENDING - validando');
                    const validateResult = await runAction(row.id, 'validate');
                    let studyId = extractStudyIdFromPayload(validateResult);

                    if (!studyId) {
                        console.log('[openRequestDetail] Validate sin studyId. Intentando convert...');
                        const convertResult = await runAction(row.id, 'convert');
                        studyId = extractStudyIdFromPayload(convertResult);
                    }

                    if (!studyId) {
                        const freshRequest = await fetchRequestById(row.id);
                        studyId = extractStudyIdFromPayload(freshRequest);
                    }

                    if (studyId) {
                        const requestWithStudy: StudyRequestRow = { ...row, convertedStudyId: studyId };
                        setSelectedRequest(requestWithStudy);
                        console.log('[openRequestDetail] Cargando estudio tras validate/convert:', studyId);
                        await fetchStudy(studyId);
                        return;
                    }
                } else {
                    console.log('[openRequestDetail] Estado VALIDATED - convirtiendo');
                    const convertResult = await runAction(row.id, 'convert');
                    let studyId = extractStudyIdFromPayload(convertResult);

                    if (!studyId) {
                        const freshRequest = await fetchRequestById(row.id);
                        studyId = extractStudyIdFromPayload(freshRequest);
                    }

                    if (studyId) {
                        const requestWithStudy: StudyRequestRow = { ...row, convertedStudyId: studyId };
                        setSelectedRequest(requestWithStudy);
                        console.log('[openRequestDetail] Cargando estudio tras convert:', studyId);
                        await fetchStudy(studyId);
                        return;
                    }
                }

                setActingId(null);
                setError('No se pudo convertir la solicitud. Por favor recarga e intenta nuevamente.');
                console.error('[openRequestDetail] No se obtuvo convertedStudyId en el flujo de apertura');
            } catch (e) {
                console.error('[openRequestDetail] Error al procesar solicitud:', e);
                setError('Error al procesar la solicitud');
                setActingId(null);
            }
        }

        // Si no se pudo procesar, mostrar detalle de solicitud
        console.log('[openRequestDetail] Mostrando solicitud sin estudio');
        setSelectedRequest(row);
    };

    const closeRequestDetail = () => {
        setSelectedRequest(null);
        setSelectedStudy(null);
    };

    const fetchStudy = async (studyId: number, retries = 3) => {
        try {
            setLoadingStudy(true);
            let lastError: any = null;

            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    console.log(`[fetchStudy] Intento ${attempt}/${retries} para estudio ${studyId}`);
                    const resp = await authFetch(`${API_URL}/api/studies/${studyId}`);
                    const j = await resp.json().catch(() => ({}));

                    if (!resp.ok) {
                        lastError = j?.message || "No se pudo obtener el estudio";
                        if (attempt < retries) {
                            await new Promise(r => setTimeout(r, 500));
                            continue;
                        }
                        break;
                    }

                    setSelectedStudy(j?.data || null);
                    console.log('[fetchStudy] Estudio obtenido exitosamente:', j?.data?.id);
                    return;
                } catch (e) {
                    lastError = e;
                    if (attempt < retries) {
                        await new Promise(r => setTimeout(r, 500));
                        continue;
                    }
                }
            }

            setError(lastError || "No se pudo obtener el estudio después de varios intentos");
        } finally {
            setLoadingStudy(false);
        }
    };

    const uploadPdfToStudy = async (studyId: number, file: File) => {
        try {
            setUploading(true);
            const fd = new FormData();
            fd.append('pdf', file);

            const resp = await authFetch(`${API_URL}/api/studies/${studyId}/pdf`, {
                method: 'PATCH',
                body: fd,
            });
            const j = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                setError(j?.message || 'No se pudo subir el PDF');
                return;
            }
            setSelectedStudy(j?.data || null);
            await loadRows();
        } catch (e) {
            console.error(e);
            setError('Error al subir el PDF');
        } finally {
            setUploading(false);
        }
    };

    const updateStudyStatusApi = async (studyId: number, statusName: 'PARTIAL' | 'COMPLETED') => {
        try {
            console.log(`[updateStudyStatusApi] Updating study ${studyId} to ${statusName}`);
            setLoadingStudy(true);
            const resp = await authFetch(`${API_URL}/api/studies/${studyId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statusName }),
            });
            const j = await resp.json().catch(() => ({}));

            console.log(`[updateStudyStatusApi] Response status: ${resp.status}`, j);

            if (!resp.ok) {
                const errorMsg = j?.message || 'No se pudo actualizar el estado';
                setError(errorMsg);
                console.error(`[updateStudyStatusApi] Error updating status: ${errorMsg}`);
                return;
            }

            setSelectedStudy(j?.data || null);
            setError(null);
            console.log(`[updateStudyStatusApi] Status updated success for study:`, j?.data?.id);

            // Mostrar mensaje de éxito
            setSuccessMessage('Solicitud procesada');

            // Recargar solicitudes 
            await loadRows();

            // Cerrar modal después de mostrar el mensaje
            await new Promise(r => setTimeout(r, 1000));

            console.log(`[updateStudyStatusApi] Cerrando modal después de actualizar estado`);
            setSuccessMessage(null);
            closeRequestDetail();

        } catch (e) {
            console.error('[updateStudyStatusApi] Exception:', e);
            setError('Error al actualizar estado');
        } finally {
            setLoadingStudy(false);
        }
    };

    const deleteAttachment = async (attachmentId: number) => {
        try {
            setUploading(true);
            const studyId = selectedStudy?.id || selectedRequest?.convertedStudyId;
            if (!studyId) return;

            const resp = await authFetch(`${API_URL}/api/studies/${studyId}/attachments/${attachmentId}`, {
                method: 'DELETE',
            });

            if (!resp.ok) {
                const j = await resp.json().catch(() => ({}));
                setError(j?.message || 'No se pudo eliminar el PDF');
                return;
            }

            await fetchStudy(studyId);
        } catch (e) {
            console.error(e);
            setError('Error al eliminar el PDF');
        } finally {
            setUploading(false);
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

    // ya no necesitamos modal de conversión


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Solicitudes de Estudio</h1>
                    <p className="text-gray-600">Revisá solicitudes de pacientes y determiná el estado del estudio (PARCIAL o COMPLETADO).</p>
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                        💡 Una vez que cambies el estado a PARCIAL o COMPLETADO, el estudio aparecerá en tu panel de gestión de estudios.
                    </p>
                    <p className="text-xs text-gray-500">
                        Última actualización: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString("es-AR") : "—"}
                    </p>
                </div>

                <section className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        <div className="p-6 text-sm text-gray-600">No hay solicitudes en proceso para el DNI buscado.</div>
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
                                            <td className="px-3 py-2 text-gray-900">{formatDateOnly(row.requestedDate)}</td>
                                            <td className="px-3 py-2 text-gray-900">{row.doctorName}</td>
                                            <td className="px-3 py-2 text-gray-900">{row.insuranceName}</td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass[row.status]}`}>
                                                    {statusLabel[row.status]}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openRequestDetail(row)}
                                                        className="rounded-md bg-slate-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                                                    >
                                                        Abrir
                                                    </button>
                                                    {row.status === "PENDING" && (
                                                        <>
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
                                                                onClick={() => runAction(row.id, "convert")}
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

            {selectedRequest && (
                <RequestDetail
                    request={selectedRequest}
                    study={selectedStudy}
                    loadingStudy={loadingStudy}
                    uploading={uploading}
                    onClose={() => closeRequestDetail()}
                    onUpload={async (file: File) => {
                        const studyId = selectedStudy?.id || selectedRequest?.convertedStudyId;
                        if (!studyId) return;
                        await uploadPdfToStudy(studyId, file);
                    }}
                    onSetStatus={async (s) => {
                        let studyId = selectedStudy?.id || selectedRequest?.convertedStudyId;

                        // Si no hay studyId disponible, intenta refrescar la solicitud para obtenerlo
                        if (!studyId) {
                            try {
                                const response = await authFetch(`${API_URL}/api/study-requests/${selectedRequest?.id}`);
                                const data = await response.json();
                                if (data?.data?.convertedStudyId) {
                                    studyId = data.data.convertedStudyId;
                                    setSelectedRequest(data.data);
                                }
                            } catch (e) {
                                console.error('Error al refrescar solicitud:', e);
                            }
                        }

                        // Si aún no hay studyId, no se puede continuar
                        if (!studyId) {
                            setError('No se pudo obtener el estudio. Por favor intenta nuevamente.');
                            return;
                        }

                        await updateStudyStatusApi(studyId, s);
                    }}
                    onDeleteAttachment={deleteAttachment}
                    apiUrl={API_URL}
                    error={error}
                    successMessage={successMessage}
                />
            )}

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


        </div>
    );
}
