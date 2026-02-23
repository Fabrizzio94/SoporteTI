"use client";

import { Tecnico } from "@/app/types/tecnico";
import { CircleCheck, CircleX, UserRoundPen } from 'lucide-react';
type PropsTecnicosTabla = {
  tecnicos: Tecnico[];
  onEdit: (tecnico: Tecnico) => void;
};

export default function TecnicosTable({
  tecnicos,
  onEdit,
}: PropsTecnicosTabla) {
  return (
    <>
      <div className="border rounded">
        <table className="w-full text-sm table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="pl-20 text-black text-left">Cedúla</th>
              <th className="p-2 text-black py-2 text-left whitespace-nowrap">Técnico</th>
              <th className="p-2 text-black text-left">Usuario</th>
              <th className="p-2 text-black text-left">Contraseña</th>
              <th className="p-2 text-black text-left">Rol</th>
              <th className="p-2 text-black text-left">Estado</th>
              <th className="p-2 text-black text-left"></th>
            </tr>
          </thead>
          <tbody>
            {tecnicos.map((t) => (
              <tr key={t.cedula} className="border-t">
                <td className="pl-20">{t.cedula}</td>
                <td className="p-2 font-medium">
                  {t.nombreCompleto}
                </td>
                <td className="p-2 text-gray-500">{t.usuario}</td>
                <td className="p-2 text-center">
                  {t.password ? (
                    <CircleCheck className="mx-auto" color="#15cb4c"/>
                  ) : (
                    <CircleX className="mx-auto" color="#cc0000"/>
                  )}
                </td>
                <td className="p-2">{t.rol}</td>
                <td className="p-2">
                  <span
                    className={`${
                      t.estado === "A"
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    } `}
                  >
                    {t.estado === "A" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Editar"
                    onClick={() => onEdit(t)}
                  >
                    <span className="text-blue-600 hover:underline">
                      <UserRoundPen
                        className="w-5 h5 hover:text-blue-600"
                      />
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
