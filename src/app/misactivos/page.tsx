"use client";

import { useEffect, useState } from "react";
import { Activo } from "../types/activo";

type MiActivo = Pick<
  Activo,
  | "codigo_activo"
  | "nombre_activo"
  | "ano_compra"
  | "estado"
  | "nombre_custodio"
  | "nombre_farmacia"
>;

export default function MisActivosPage() {
  const [activos, setActivos] = useState<MiActivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/activos/misactivos")
      .then((r) => r.json())
      .then((d) => setActivos(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activos.filter(
    (a) =>
      a.codigo_activo.toLowerCase().includes(search.toLowerCase()) ||
      a.nombre_activo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mis Activos</h1>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por código, nombre o farmacia..."
          className="w-full max-w-sm border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                N°
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Código
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nombre Activo
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Centro Costo Origen
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Fecha Alta
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estado
              </th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No se encontraron activos asignados
                </td>
              </tr>
            ) : (
              filtered.map((a, index) => (
                <tr key={a.codigo_activo} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {a.codigo_activo}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {a.nombre_activo}
                  </td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total */}
      {!loading && (
        <p className="text-xs text-slate-400 mt-3">
          {filtered.length} activo{filtered.length !== 1 ? "s" : ""} encontrado
          {filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </main>
  );
}
