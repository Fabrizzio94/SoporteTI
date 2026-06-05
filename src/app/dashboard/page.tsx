"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type ChartItem = { nombre: string; total: number };

type DashboardData = {
  resumen: { totalFarmacias: number; totalServidores: number };
  tipoFarmacia: ChartItem[];
  marcas: ChartItem[];
  tecnologia: ChartItem[];
  soTerminales: ChartItem[];
  soServidor: ChartItem[];
  ram: ChartItem[];
  virtualizador: ChartItem[];
};

const COLORS = {
  primary: "#4f46e5",
  secondary: "#0ea5e9",
  accent: "#10b981",
  warning: "#f59e0b",
  muted: "#94a3b8",
  sinDatos: "#e2e8f0",
};

const getBarColor = (nombre: string) =>
  nombre === "Sin datos" ? COLORS.sinDatos : COLORS.primary;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-medium text-slate-700">{label}</p>
        <p className="text-indigo-600 font-bold">
          {payload[0].value} registros
        </p>
      </div>
    );
  }
  return null;
};

const SinDatosAlert = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
      {count} registro{count !== 1 ? "s" : ""} sin datos — pendiente de
      actualizar
    </p>
  );
};

const ChartCard = ({
  title,
  data,
  color = COLORS.primary,
}: {
  title: string;
  data: ChartItem[];
  color?: string;
}) => {
  const sinDatos = data.find((d) => d.nombre === "Sin datos")?.total ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="nombre"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.nombre === "Sin datos" ? COLORS.sinDatos : color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <SinDatosAlert count={sinDatos} />
    </div>
  );
};

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

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="p-6 space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
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
        <p className="text-sm text-slate-400 mt-1">
          Vista general del estado de la infraestructura
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <StatCard label="Total Farmacias" value={data.resumen.totalFarmacias} />
        <StatCard
          label="Total Servidores"
          value={data.resumen.totalServidores}
        />
      </div>

      {/* Sección Farmacias */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Farmacias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Tipo de Farmacia"
            data={data.tipoFarmacia}
            color={COLORS.primary}
          />
          <ChartCard
            title="Marcas"
            data={data.marcas}
            color={COLORS.secondary}
          />
          <ChartCard
            title="Tecnología Terminales"
            data={data.tecnologia}
            color={COLORS.accent}
          />
          <ChartCard
            title="SO Terminales"
            data={data.soTerminales}
            color={COLORS.warning}
          />
        </div>
      </div>

      {/* Sección Servidores */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Servidores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Sistema Operativo Servidor"
            data={data.soServidor}
            color={COLORS.primary}
          />
          <ChartCard
            title="RAM (GB)"
            data={data.ram}
            color={COLORS.secondary}
          />
          <ChartCard
            title="Virtualizador"
            data={data.virtualizador}
            color={COLORS.accent}
          />
        </div>
      </div>
    </main>
  );
}
