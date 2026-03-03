"use client";

import React from "react";

interface Props {
  request: any;
  study: any | null;
  loadingStudy: boolean;
  uploading: boolean;
  onClose: () => void;
  onConvert: () => void;
  onUpload: (file: File) => void;
  onSetStatus: (status: "PARTIAL" | "COMPLETED") => void;
  apiUrl: string;
}

export default function RequestDetail({ request, study, loadingStudy, uploading, onClose, onConvert, onUpload, onSetStatus, apiUrl }: Props) {
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
            <div className="mt-1 text-gray-900">{request.status}</div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-3">
          {study ? (
            <div>
              <h3 className="font-semibold">Estudio asociado</h3>
              <p className="text-sm text-gray-600">ID: {study.id} — Estado: {study.status?.name || study.statusName || '-'}</p>

              <div className="mt-2 flex items-center gap-2">
                {pdfUrl ? (
                  <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Descargar PDF</a>
                ) : (
                  <span className="text-sm text-gray-500">No hay PDF cargado aún</span>
                )}

                <label className="ml-4 inline-flex items-center gap-2 bg-slate-100 px-2 py-1 rounded cursor-pointer text-sm">
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

                <button onClick={() => onSetStatus('PARTIAL')} className="ml-2 rounded-md bg-amber-500 px-2 py-1 text-xs text-white">Marcar PARCIAL</button>
                <button onClick={() => onSetStatus('COMPLETED')} className="ml-2 rounded-md bg-green-600 px-2 py-1 text-xs text-white">Marcar COMPLETADO</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Aún no existe un estudio convertido para esta solicitud.</p>
              <div className="flex items-center gap-2">
                <button onClick={onConvert} className="rounded-md bg-green-600 px-3 py-2 text-sm text-white">Convertir a estudio</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
