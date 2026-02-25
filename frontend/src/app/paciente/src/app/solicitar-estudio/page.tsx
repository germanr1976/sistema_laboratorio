"use client";

import { useEffect, useMemo, useState } from "react";
import authFetch from "../../../../../utils/authFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const MAX_ORDER_IMAGE_SIZE_MB = 15;
const MAX_ORDER_IMAGE_SIZE_BYTES = MAX_ORDER_IMAGE_SIZE_MB * 1024 * 1024;

type StudyRequestStatus = "PENDING" | "VALIDATED" | "REJECTED" | "CONVERTED";

interface StudyRequestItem {
    id: number;
    requestedDate: string;
    doctorName: string;
    insuranceName: string;
    medicalOrderPhotoUrl?: string | null;
    observations?: string | null;
    status: StudyRequestStatus;
    createdAt: string;
    validatedAt?: string | null;
    convertedStudyId?: number | null;
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

const todayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function SolicitarEstudioPage() {
    const [requestedDate, setRequestedDate] = useState(todayLocal());
    const [doctorName, setDoctorName] = useState("");
    const [insuranceName, setInsuranceName] = useState("");
    const [medicalOrderPhoto, setMedicalOrderPhoto] = useState<File | null>(null);
    const [medicalOrderPreviewUrl, setMedicalOrderPreviewUrl] = useState<string | null>(null);
    const [medicalOrderError, setMedicalOrderError] = useState<string | null>(null);
    const [observations, setObservations] = useState("");

    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<StudyRequestItem[]>([]);

    const resolveOrderUrl = (value?: string | null) => {
        if (!value) return null;
        return value.startsWith("http") ? value : `${API_URL}${value}`;
    };

    const canSubmit = useMemo(() => {
        return !!requestedDate && doctorName.trim().length >= 2 && insuranceName.trim().length >= 2;
    }, [requestedDate, doctorName, insuranceName]);

    const loadMyRequests = async () => {
        try {
            setLoadingList(true);
            const response = await authFetch(`${API_URL}/api/study-requests/mine`);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data?.message || "No se pudieron cargar tus solicitudes");
                setRequests([]);
                return;
            }

            const items = Array.isArray(data?.data) ? data.data : [];
            setRequests(items);
            setError(null);
        } catch (e) {
            console.error(e);
            setError("Error al conectar con el servidor");
            setRequests([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        loadMyRequests();
    }, []);

    useEffect(() => {
        if (!medicalOrderPhoto) {
            setMedicalOrderPreviewUrl(null);
            return;
        }

        const nextPreviewUrl = URL.createObjectURL(medicalOrderPhoto);
        setMedicalOrderPreviewUrl(nextPreviewUrl);

        return () => {
            URL.revokeObjectURL(nextPreviewUrl);
        };
    }, [medicalOrderPhoto]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("requestedDate", requestedDate);
            formData.append("doctorName", doctorName.trim());
            formData.append("insuranceName", insuranceName.trim());
            formData.append("observations", observations.trim());
            if (medicalOrderPhoto) {
                formData.append("medicalOrderPhoto", medicalOrderPhoto);
            }

            const response = await authFetch(`${API_URL}/api/study-requests`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data?.message || "No se pudo crear la solicitud");
                return;
            }

            if (data?.data) {
                setRequests((prev) => [data.data, ...prev]);
            } else {
                await loadMyRequests();
            }

            setDoctorName("");
            setInsuranceName("");
            setMedicalOrderPhoto(null);
            setMedicalOrderError(null);
            setObservations("");
            setRequestedDate(todayLocal());
            setError(null);
        } catch (submitError) {
            console.error(submitError);
            setError("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitar estudio</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Cargá tu orden médica para que el laboratorio la valide antes de crear el estudio.
                    </p>

                    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha solicitada</label>
                            <input
                                type="date"
                                value={requestedDate}
                                onChange={(e) => setRequestedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Médico solicitante</label>
                            <input
                                type="text"
                                value={doctorName}
                                onChange={(e) => setDoctorName(e.target.value)}
                                placeholder="Nombre del médico"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Obra social</label>
                            <input
                                type="text"
                                value={insuranceName}
                                onChange={(e) => setInsuranceName(e.target.value)}
                                placeholder="Ej: OSDE"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto de orden médica (opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (!file) {
                                        setMedicalOrderPhoto(null);
                                        setMedicalOrderError(null);
                                        return;
                                    }

                                    if (!file.type.startsWith("image/")) {
                                        setMedicalOrderPhoto(null);
                                        setMedicalOrderError("Solo se permiten archivos de imagen.");
                                        return;
                                    }

                                    if (file.size > MAX_ORDER_IMAGE_SIZE_BYTES) {
                                        setMedicalOrderPhoto(null);
                                        setMedicalOrderError(`La imagen supera el máximo de ${MAX_ORDER_IMAGE_SIZE_MB}MB.`);
                                        return;
                                    }

                                    setMedicalOrderPhoto(file);
                                    setMedicalOrderError(null);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {medicalOrderPhoto && (
                                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                                    <p className="text-xs text-gray-500">Archivo seleccionado: {medicalOrderPhoto.name}</p>
                                    {medicalOrderPreviewUrl && (
                                        <img
                                            src={medicalOrderPreviewUrl}
                                            alt="Vista previa de orden médica"
                                            className="max-h-48 w-auto rounded-md border border-gray-200"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMedicalOrderPhoto(null);
                                            setMedicalOrderError(null);
                                        }}
                                        className="text-xs text-red-600 hover:text-red-700"
                                    >
                                        Quitar imagen
                                    </button>
                                </div>
                            )}
                            {!medicalOrderPhoto && !medicalOrderError && (
                                <p className="text-xs text-gray-500 mt-1">Formatos permitidos: imágenes. Máximo: {MAX_ORDER_IMAGE_SIZE_MB}MB.</p>
                            )}
                            {medicalOrderError && (
                                <p className="text-xs text-red-600 mt-1">{medicalOrderError}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                            <textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                rows={3}
                                placeholder="Indicaciones adicionales"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={!canSubmit || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Enviando..." : "Crear solicitud"}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Mis solicitudes</h3>
                        <button
                            type="button"
                            onClick={loadMyRequests}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Recargar
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {loadingList ? (
                        <p className="text-sm text-gray-600">Cargando solicitudes...</p>
                    ) : requests.length === 0 ? (
                        <p className="text-sm text-gray-600">Todavía no tenés solicitudes de estudio.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-gray-200">
                            <table className="w-full text-sm table-auto">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Fecha</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Médico</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Obra social</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Estado</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Orden</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {requests.map((request) => (
                                        <tr key={request.id}>
                                            <td className="px-3 py-2 text-gray-900">
                                                {new Date(request.requestedDate).toLocaleDateString("es-AR")}
                                            </td>
                                            <td className="px-3 py-2 text-gray-900">{request.doctorName}</td>
                                            <td className="px-3 py-2 text-gray-900">{request.insuranceName}</td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass[request.status]}`}>
                                                    {statusLabel[request.status]}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                {resolveOrderUrl(request.medicalOrderPhotoUrl) ? (
                                                    <a
                                                        href={resolveOrderUrl(request.medicalOrderPhotoUrl)!}
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
