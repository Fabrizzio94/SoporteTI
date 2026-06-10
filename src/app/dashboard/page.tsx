"use client";
import { useEffect, useState } from "react";
import TabsNav from "@/app/components/dashboard/TabsNav";
import GraficosTab from "@/app/components/dashboard/GraficosTab";
import TablasTab from "@/app/components/dashboard/TablasTab";
import { DashboardData } from "@/app/types/dashboardTypes";

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className="text-3xl font-bold text-slate-800">
      {value.toLocaleString()}
    </p>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("graficos");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);
  // esqueleton
  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        {/* <p className="text-sm text-slate-400 mt-1">
          Vista general del estado de la infraestructura
        </p> */}
      </div>

      {/* Tarjetas resumen — siempre visibles */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <StatCard label="Total Farmacias" value={data.resumen.totalFarmacias} />
        <StatCard
          label="Total Servidores"
          value={data.resumen.totalServidores}
        />
      </div>

      {/* Submenú de pestañas */}
      <TabsNav activa={tab} onChange={setTab} />

      {/* Contenido según pestaña activa */}
      {tab === "graficos" && <GraficosTab data={data} />}
      {tab === "tablas" && <TablasTab />}
      {/* {tab === "nueva" && <ComponenteNuevoTab data={data} />} */}
    </main>
  );
}
