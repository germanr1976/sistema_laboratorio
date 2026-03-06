"use client";

import { useEffect, useMemo, useState } from "react";
import authFetch from "../../../../../utils/authFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const todayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function SolicitarEstudioPage() {
    const [patientDni, setPatientDni] = useState("");
    const [patientFullName, setPatientFullName] = useState("");
    const [requestedDate, setRequestedDate] = useState(todayLocal());
    const [doctorName, setDoctorName] = useState("");
    const [insuranceName, setInsuranceName] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSuccessMessage(null);

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
                setSuccessMessage(null);
                return;
            }

            setDoctorName("");
            setInsuranceName("");
            setRequestedDate(todayLocal());
            setError(null);
            setSuccessMessage("Solicitud procesada");
        } catch (submitError) {
            console.error(submitError);
            setError("Error al conectar con el servidor");
            setSuccessMessage(null);
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

                    {successMessage && (
                        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

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
            </div>
        </div>
    );
}
