import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  ChartItem,
  DashboardData,
  COLORS,
  ALIAS,
} from "@/app/types/dashboardTypes";

// ── Tooltip personalizado ──────────────────────────────────────
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

// ── Alerta Sin datos ───────────────────────────────────────────
const SinDatosAlert = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
      {count} registro{count !== 1 ? "s" : ""} sin datos — pendiente de
      actualizar
    </p>
  );
};

// ── Tarjeta de gráfico ─────────────────────────────────────────
const ChartCard = ({
  title,
  data = [],
  color = COLORS.primary,
  tooltipSuffix = "registros",
  inclinado = false,
  mostrarValores = false,
}: {
  title: string;
  data?: ChartItem[];
  color?: string;
  tooltipSuffix?: string;
  inclinado?: boolean;
  mostrarValores?: boolean;
}) => {
  const sinDatos = data.find((d) => d.nombre === "Sin datos")?.total ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data ?? []}
          margin={{
            top: mostrarValores ? 15 : 0,
            right: 0,
            left: -20,
            bottom: inclinado ? 20 : 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="nombre"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => ALIAS[value] ?? value}
            {...(inclinado && {
              angle: -35,
              textAnchor: "end",
              interval: 0,
              height: 60,
            })}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {mostrarValores && (
              <LabelList
                dataKey="total"
                position="top"
                formatter={(value: unknown) => {
                  const num = Number(value);
                  return num > 0 ? num : "";
                }}
                style={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
              />
            )}
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

// ── GraficosTab ────────────────────────────────────────────────
type Props = { data: DashboardData };

export default function GraficosTab({ data }: Props) {
  return (
    <div className="space-y-8 pt-6">
      {/* Farmacias */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Farmacias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Tipo de Farmacia"
            data={data.tipoFarmacia}
            color={COLORS.primary}
            mostrarValores
          />
          <ChartCard
            title="Marcas"
            data={data.marcas}
            mostrarValores
            inclinado
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
          <ChartCard
            title="Puntos de Venta por Tecnología"
            data={data.num_puntos_venta}
            color={COLORS.secondary}
            inclinado
            mostrarValores
            tooltipSuffix="puntos de venta"
          />
        </div>
      </div>

      {/* Servidores */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Servidores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Sistema Operativo"
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
    </div>
  );
}
