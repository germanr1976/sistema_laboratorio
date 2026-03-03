"use client";

import { useEffect, useMemo, useState } from "react";
import authFetch from "../../../../../utils/authFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
    CONVERTED: "En proceso",
};

const statusClass: Record<StudyRequestStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    VALIDATED: "bg-blue-100 text-blue-800 border-blue-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    CONVERTED: "bg-blue-100 text-blue-800 border-blue-200",
};

const todayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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

export default function SolicitarEstudioPage() {
    const [patientDni, setPatientDni] = useState("");
    const [patientFullName, setPatientFullName] = useState("");
    const [requestedDate, setRequestedDate] = useState(todayLocal());
    const [doctorName, setDoctorName] = useState("");
    const [insuranceName, setInsuranceName] = useState("");

    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<StudyRequestItem[]>([]);

    const canSubmit = useMemo(() => {
        return !!patientDni && !!patientFullName && !!requestedDate && doctorName.trim().length >= 2 && insuranceName.trim().length >= 2;
    }, [patientDni, patientFullName, requestedDate, doctorName, insuranceName]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("userData");
            if (!stored) return;

            const parsed = JSON.parse(stored);
            const dni = (parsed?.dni || "").toString().trim();
            const firstName = (parsed?.profile?.firstName || parsed?.firstName || "").toString().trim();
            const lastName = (parsed?.profile?.lastName || parsed?.lastName || "").toString().trim();
            const fullName = `${firstName} ${lastName}`.trim();

            setPatientDni(dni);
            setPatientFullName(fullName);
        } catch (parseError) {
            console.error(parseError);
        }
    }, []);

    const loadMyRequests = async () => {
        try {
            setLoadingList(true);
            const response = await authFetch(`${API_URL}/api/study-requests/mine`);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data?.message || "No se pudieron cargar tus estudios solicitados");
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

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        if (!patientDni || !patientFullName) {
            setError("No se pudieron autocompletar tus datos de paciente. Volvé a iniciar sesión.");
            return;
        }

        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/api/study-requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    requestedDate,
                    doctorName: doctorName.trim(),
                    insuranceName: insuranceName.trim(),
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data?.message || "No se pudo solicitar el estudio");
                return;
            }

            if (data?.data) {
                setRequests((prev) => [data.data, ...prev]);
            } else {
                await loadMyRequests();
            }

            setDoctorName("");
            setInsuranceName("");
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
                        Completá los datos y presioná SOLICITAR para crear tu estudio en estado EN PROCESO.
                    </p>

                    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                            <input
                                type="text"
                                value={patientDni}
                                readOnly
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y apellido</label>
                            <input
                                type="text"
                                value={patientFullName}
                                readOnly
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del estudio</label>
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

                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={!canSubmit || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Solicitando..." : "SOLICITAR"}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Mis estudios solicitados</h3>
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
                        <p className="text-sm text-gray-600">Cargando estudios solicitados...</p>
                    ) : requests.length === 0 ? (
                        <p className="text-sm text-gray-600">Todavía no tenés estudios solicitados.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-gray-200">
                            <table className="w-full text-sm table-auto">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Fecha</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Médico</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Obra social</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {requests.map((request) => (
                                        <tr key={request.id}>
                                            <td className="px-3 py-2 text-gray-900">
                                                {formatDateOnly(request.requestedDate)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-900">{request.doctorName}</td>
                                            <td className="px-3 py-2 text-gray-900">{request.insuranceName}</td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass[request.status]}`}>
                                                    {statusLabel[request.status]}
                                                </span>
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
