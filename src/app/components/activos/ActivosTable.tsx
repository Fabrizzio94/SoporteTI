"use client";
import { Activo } from "@/app/types/activo";
import { Pencil } from "lucide-react";

type Props = {
  activos: Activo[];
  onEdit: (activo: Activo) => void;
};

export default function ActivosTable({ activos, onEdit }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100 border-b-2 border-slate-200">
          <tr>
            {[
              "Código",
              "Nombre Activo",
              "Farmacia",
              "Técnico",
              "Año",
              "Estado",
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
          {activos.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="text-center py-10 text-slate-400 text-sm"
              >
                No hay activos registrados
              </td>
            </tr>
          ) : (
            activos.map((a) => (
              <tr
                key={a.codigo_activo}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {a.codigo_activo}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {a.nombre_activo}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {a.nombre_farmacia}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {a.nombre_tecnico ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {a.ano_compra ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    ● Activo
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onEdit(a)}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
