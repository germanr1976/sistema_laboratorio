"use client";

import { useState } from "react";

export default function ConfiguracionesPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Configuraciones</h1>
        <p className="text-gray-600">Gestioná tus notificaciones y opciones de soporte.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>

        <label className="flex items-center justify-between gap-4 rounded-md border border-gray-200 p-4">
          <div>
            <p className="font-medium text-gray-900">Avisos por email</p>
            <p className="text-sm text-gray-600">Recibí un aviso cuando un estudio cambie a Completado.</p>
          </div>
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-md border border-gray-200 p-4">
          <div>
            <p className="font-medium text-gray-900">Avisos por WhatsApp</p>
            <p className="text-sm text-gray-600">Recibí un mensaje cuando haya resultados nuevos disponibles.</p>
          </div>
          <input
            type="checkbox"
            checked={whatsAppEnabled}
            onChange={(e) => setWhatsAppEnabled(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <p className="text-xs text-gray-500">
          Cambios de notificación guardados localmente para esta sesión.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Soporte</h2>
        <p className="text-gray-700">Si tenés problemas para ver o descargar estudios, podés contactarnos por estos canales:</p>

        <div className="space-y-1 text-gray-700">
          <p><strong>WhatsApp:</strong> +54 11 0000-0000</p>
          <p><strong>Teléfono:</strong> +54 11 0000-0000</p>
          <p><strong>Email:</strong> soporte@laboratorio.com</p>
        </div>

        <p className="text-sm text-gray-600">
          Horario de atención: lunes a viernes de 8:00 a 18:00.
        </p>
      </section>
    </div>
  );
}
