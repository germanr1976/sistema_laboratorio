"use client";

import React, { useState } from "react";
import { Eye, Download, Trash2, X } from "lucide-react";

interface Props {
    request: any;
    study: any | null;
    loadingStudy: boolean;
    uploading: boolean;
    onClose: () => void;
    onUpload: (file: File) => void;
    onSetStatus: (status: "PARTIAL" | "COMPLETED") => void;
    onDeleteAttachment?: (attachmentId: number) => void;
    apiUrl: string;
    error?: string | null;
    successMessage?: string | null;
}

// mismo mapeo que en page.tsx
const statusLabel: Record<string, string> = {
    PENDING: "En proceso",
    VALIDATED: "Validada",
    REJECTED: "Rechazada",
    CONVERTED: "En proceso",
};

export default function RequestDetail({ request, study, loadingStudy, uploading, onClose, onUpload, onSetStatus, onDeleteAttachment, apiUrl, error, successMessage }: Props) {
    const [showPdfModal, setShowPdfModal] = useState(false);

    if (!request) return null;

    const patientName = `${request.patient?.profile?.firstName || ""} ${request.patient?.profile?.lastName || ""}`.trim() || "-";

    const pdfUrl = study?.pdfUrl ? (study.pdfUrl.startsWith("http") ? study.pdfUrl : `${apiUrl}${study.pdfUrl}`) : null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white border border-gray-200 shadow-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Solicitud #{request.id}</h2>
                    <button onClick={onClose} className="text-sm text-gray-500 underline">Cerrar</button>
                </div>

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                        {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600">DNI</label>
                        <div className="mt-1 text-gray-900">{request.dni}</div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600">Paciente</label>
                        <div className="mt-1 text-gray-900">{patientName}</div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Fecha solicitada</label>
                        <div className="mt-1 text-gray-900">{request.requestedDate}</div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600">Obra social</label>
                        <div className="mt-1 text-gray-900">{request.insuranceName}</div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Médico</label>
                        <div className="mt-1 text-gray-900">{request.doctorName}</div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600">Estado</label>
                        <div className="mt-1 text-gray-900">{statusLabel[request.status]}</div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-3">
                    {loadingStudy ? (
                        <div className="space-y-3 text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-600 font-medium">Preparando estudio...</p>
                            <p className="text-xs text-gray-500">Por favor espera mientras se valida la solicitud</p>
                        </div>
                    ) : study ? (
                        <div className="space-y-3">
                            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2">
                                <p className="text-sm text-green-700">✓ Estudio cargado exitosamente</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {pdfUrl ? (
                                    <>
                                        <button
                                            onClick={() => setShowPdfModal(true)}
                                            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            title="Ver PDF"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <a
                                            href={pdfUrl}
                                            download
                                            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            title="Descargar PDF"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                        {study.attachments && study.attachments.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    if (onDeleteAttachment && study.attachments[0]?.id) {
                                                        onDeleteAttachment(study.attachments[0].id);
                                                    }
                                                }}
                                                className="rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                title="Eliminar PDF"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-500">No hay PDF cargado aún</span>
                                )}
                            </div>

                            <label className="inline-flex items-center gap-2 bg-slate-100 px-3 py-2 rounded cursor-pointer text-sm hover:bg-slate-200">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) onUpload(f);
                                    }}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                {uploading ? 'Subiendo...' : 'Subir PDF'}
                            </label>

                            <div className="flex items-center gap-2">
                                <button onClick={() => onSetStatus('PARTIAL')} disabled={uploading || loadingStudy} className="rounded-md bg-amber-500 px-3 py-2 text-xs text-white hover:bg-amber-600 disabled:opacity-50">Marcar PARCIAL</button>
                                <button onClick={() => onSetStatus('COMPLETED')} disabled={uploading || loadingStudy} className="rounded-md bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 disabled:opacity-50">Marcar COMPLETADO</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Esta solicitud está pendiente de validación por un profesional.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para ver PDF */}
            {showPdfModal && pdfUrl && (
                <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Vista previa del PDF</h3>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <div className="h-[calc(90vh-60px)]">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full border-0"
                                title="Vista previa del PDF"
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-4 py-3 border-t bg-gray-50">
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                            >
                                Cerrar
                            </button>
                            <a
                                href={pdfUrl}
                                download
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors inline-flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Descargar
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
