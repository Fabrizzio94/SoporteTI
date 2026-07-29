"use client";
import { Activo, MiActivo } from "@/app/types/activo";
import { Pencil } from "lucide-react";

interface Props {
  activos: MiActivo[];
  onEdit: (activo: MiActivo) => void;
  loading: boolean;
}

export default function MisActivosTable({ activos, onEdit, loading }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {[
              "N°",
              "Código",
              "Nombre Activo",
              "Centro Costo Origen",
              "Fecha Alta",
              "Estado",
              "",
            ].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : activos.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                No se encontraron activos asignados
              </td>
            </tr>
          ) : (
            activos.map((a, index) => (
              <tr key={a.codigo_activo} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {index + 1}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {a.codigo_activo}
                </td>
                <td className="px-4 py-3 text-slate-700">{a.nombre_activo}</td>
                <td className="px-4 py-3 text-slate-600">
                  {a.nombre_farmacia ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {a.ano_compra ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.estado === "A"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {a.estado === "A" ? "Activo" : "Inactivo"}
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
