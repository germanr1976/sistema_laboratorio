import PatientStudiesBoard from "../../componentes/PatientStudiesBoard";

export default function PendientesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <PatientStudiesBoard
          title="Estudios en curso"
          subtitle="Revisa los estudios pendientes o en proceso."
          initialFilter="open"
          emptyHint="No hay estudios pendientes por ahora."
        />
      </div>
    </div>
  );
}
