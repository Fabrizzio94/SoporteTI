"use client";
import { useEffect, useState } from "react";
import { TablaItem, TablasData } from "@/app/types/dashboardTypes";

// ── Tabla reutilizable ─────────────────────────────────────────
const TablaDesglose = ({
  title,
  data = [],
}: {
  title: string;
  data: TablaItem[];
}) => {
  const totalPropias = data.reduce((s, r) => s + r.propias, 0);
  const totalFranquicias = data.reduce((s, r) => s + r.franquicias, 0);
  const totalSinTipo = data.reduce((s, r) => s + r.sin_tipo, 0);
  const totalGeneral = data.reduce((s, r) => s + r.total, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Categoría
              </th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Propias
              </th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Franquicias
              </th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sin tipo
              </th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr
                key={row.nombre}
                className={`hover:bg-slate-50 ${row.nombre === "Sin datos" ? "bg-amber-50" : ""}`}
              >
                <td className="px-4 py-2 text-slate-700 font-medium">
                  {row.nombre}
                </td>
                <td className="px-4 py-2 text-right text-slate-600">
                  {row.propias || "—"}
                </td>
                <td className="px-4 py-2 text-right text-slate-600">
                  {row.franquicias || "—"}
                </td>
                <td className="px-4 py-2 text-right text-slate-600">
                  {row.sin_tipo || "—"}
                </td>
                <td className="px-4 py-2 text-right font-bold text-slate-800">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">
                Total general
              </td>
              <td className="px-4 py-2 text-right font-bold text-slate-800">
                {totalPropias || "—"}
              </td>
              <td className="px-4 py-2 text-right font-bold text-slate-800">
                {totalFranquicias || "—"}
              </td>
              <td className="px-4 py-2 text-right font-bold text-slate-800">
                {totalSinTipo || "—"}
              </td>
              <td className="px-4 py-2 text-right font-bold text-indigo-600">
                {totalGeneral}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ── TablasTab ──────────────────────────────────────────────────
export default function TablasTab() {
  const [data, setData] = useState<TablasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/tablas")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 pt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pt-6">
      {/* Farmacias */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Farmacias
        </h2>
        <div className="space-y-4">
          {/* Fila 1: Tecnología + Marcas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TablaDesglose
              title="Tecnología Terminales"
              data={data.tecnologia}
            />
            <TablaDesglose title="Marcas" data={data.marcas} />
          </div>
          {/* Fila 2: SO Terminales + Puntos de Venta */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TablaDesglose title="SO Terminales" data={data.soTerminales} />
            <TablaDesglose
              title="Puntos de Venta por Tecnología"
              data={data.puntosVenta}
            />
          </div>
        </div>
      </div>

      {/* Servidores */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Servidores
        </h2>
        <div className="space-y-4">
          {/* Fila 1: SO Servidor + RAM */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TablaDesglose
              title="Sistema Operativo Servidor"
              data={data.soServidor}
            />
            <TablaDesglose title="RAM (GB)" data={data.ram} />
          </div>
          {/* Fila 2: Año Compra Servidor */}
          <TablaDesglose
            title="Año de Compra Servidor"
            data={data.anoCompraServidor}
          />
        </div>
      </div>
    </div>
  );
}
