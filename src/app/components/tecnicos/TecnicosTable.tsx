"use client";

import { Tecnico } from "@/app/types/tecnico";

const MOCK_TECNICOS: Tecnico[] = [
  {
    id: 1,
    oficina: "1723373765",
    nombre: "JHONNY FABRICIO CHAMBA LOPEZ",
    usuario: "jchamba",
    celular: "0985352667",
    ciudad: "MACHALA",
    provincia: "EL ORO",
    activo: true,
  },
];

export default function TecnicosTable() {
  return (
    <div className="border rounded">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-black text-left">Oficina</th>
            <th className="p-2 text-black text-left">Técnico</th>
            <th className="p-2 text-black text-left">Usuario</th>
            <th className="p-2 text-black text-left">Celular</th>
            <th className="p-2 text-black text-left">Ciudad</th>
            <th className="p-2 text-black text-left">Provincia</th>
            <th className="p-2 text-black text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TECNICOS.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">{t.oficina}</td>
              <td className="p-2 truncate max-w-[100px] font-medium">{t.nombre}</td>
              <td className="p-2 text-gray-500">{t.usuario}</td>
              <td className="p-2">{t.celular}</td>
              <td className="p-2">{t.ciudad}</td>
              <td className="p-2">{t.provincia}</td>
              <td className="p-2">
                <span className="text-green-600 font-medium">Activo</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
