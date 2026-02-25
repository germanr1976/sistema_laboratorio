export default function AyudaPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-2">Ayuda</h1>
        <p className="text-gray-600">Información útil para usar tu portal de estudios.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Cómo usar el portal</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>En <strong>Dashboard</strong> podrás ver un resumen de tus estudios y su estado.</li>
          <li>En <strong>Historial</strong> podés filtrar por rango de fechas y ordenar por más recientes o más antiguos.</li>
          <li>Desde el historial podés <strong>ver</strong> y <strong>descargar</strong> tus PDFs de resultados.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Estados de tus estudios</h2>
        <ul className="space-y-2 text-gray-700">
          <li><strong>En Proceso:</strong> tu estudio fue recibido y está en análisis.</li>
          <li><strong>Parcial:</strong> hay un resultado preliminar disponible.</li>
          <li><strong>Completado:</strong> el resultado final ya está disponible para ver o descargar.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Problemas frecuentes</h2>
        <div className="space-y-3 text-gray-700">
          <div>
            <p className="font-medium">No veo un estudio en mi historial</p>
            <p className="text-sm text-gray-600">Verificá el rango de fechas y el orden seleccionado. Si persiste, contactá al laboratorio.</p>
          </div>
          <div>
            <p className="font-medium">No puedo descargar el PDF</p>
            <p className="text-sm text-gray-600">Intentá nuevamente desde el botón de descarga. Si falla, probá recargar la página.</p>
          </div>
          <div>
            <p className="font-medium">Veo datos incompletos</p>
            <p className="text-sm text-gray-600">Algunos datos se completan cuando el estudio pasa a estado final. Si notás un error, escribinos.</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Contacto y soporte</h2>
        <div className="text-gray-700 space-y-1">
          <p><strong>WhatsApp:</strong> +54 11 0000-0000</p>
          <p><strong>Teléfono:</strong> +54 11 0000-0000</p>
          <p><strong>Email:</strong> soporte@laboratorio.com</p>
          <p className="text-sm text-gray-600 mt-2">Para urgencias médicas, comunicate por teléfono con el laboratorio.</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Privacidad y seguridad</h2>
        <p className="text-gray-700 text-sm">
          Si usás un dispositivo compartido, recordá cerrar sesión desde el menú lateral al finalizar.
        </p>
      </section>
    </div>
  );
}
