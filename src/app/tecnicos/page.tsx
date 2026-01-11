"use client";

import TecnicosTable from "@/app/components/tecnicos/TecnicosTable";
import TecnicoModal from "@/app/components/tecnicos/TecnicosModal";
import TecnicoSearch from "@/app/components/tecnicos/TecnicoSearch";
import { Tecnico } from "@/app/types/tecnico";
import { useState } from "react";
export const MOCK_TECNICOS: Tecnico[] = [
  {
    cedula: "1723373765",
    nombre: "JHONNY FABRICIO CHAMBA LOPEZ",
    usuario: "jchamba",
    celular: "0985352667",
    activo: true,
  },
  {
    cedula: "1105542417",
    nombre: "MARITZA ALEXANDRA VITERI ENRIQUEZ",
    usuario: "maviterie",
    celular: "0985352667",
    activo: true,
  },
];


export default function TecnicosPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_TECNICOS.filter((t) =>
  t.nombre.toLowerCase().includes(search.toLowerCase()) ||
  t.cedula.includes(search) ||
  t.usuario.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Técnicos</h1>

      <div className="flex justify-between items-center mb-4">
        <TecnicoSearch onSearch={setSearch}/>
        <TecnicoModal />
      </div>

      <TecnicosTable tecnicos={filtered}/>
    </main>
  );
}
