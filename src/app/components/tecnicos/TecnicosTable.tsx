"use client";

import { Tecnico } from "@/app/types/tecnico";
import { CircleCheck, CircleX, UserRoundPen } from "lucide-react";
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
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm table-auto border-collapse">
          <thead className="bg-gray-100 border-b-2 border-slate-200">
            <tr>
              {[
                "CEDULA",
                "TECNICO",
                "USUARIO",
                "CONTRASEÑA",
                "ROL",
                "ESTADO",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="bg-slate-50 text-black-500 text-xs uppercase tracking-wide px-4 py-3 text-left border-b border-slate-100 font-semibold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tecnicos.map((t) => (
              <tr
                key={t.cedula}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="pl-10">{t.cedula}</td>
                <td className="px-4 py-3 text-sm text-slate-700 font-bold">
                  {t.nombreCompleto}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {t.usuario}
                </td>
                <td className="p-2 ">
                  {t.password ? (
                    <CircleCheck className="mx-auto" color="#15cb4c" />
                  ) : (
                    <CircleX className="mx-auto" color="#cc0000" />
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
                      <UserRoundPen className="w-5 h5 hover:text-blue-600" />
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
