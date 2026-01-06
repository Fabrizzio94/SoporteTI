import TecnicosTable from "@/app/components/tecnicos/TecnicosTable";
import TecnicoModal from "@/app/components/tecnicos/TecnicosModal";
import TecnicoSearch from "@/app/components/tecnicos/TecnicoSearch";

export default function TecnicosPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Técnicos</h1>

      <div className="flex justify-between items-center mb-4">
        <TecnicoSearch />
        <TecnicoModal />
      </div>

      <TecnicosTable />
    </main>
  );
}
