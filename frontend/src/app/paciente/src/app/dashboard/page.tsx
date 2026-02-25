import PatientStudiesBoard from "../../componentes/PatientStudiesBoard";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <PatientStudiesBoard
          title="Mis estudios"
          subtitle="Consultá el estado y los resultados de tus estudios."
        />
      </div>
    </div>
  );
}
