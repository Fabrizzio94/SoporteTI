import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { ChartItemAgrupado, COLORS } from "@/app/types/dashboardTypes";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-medium text-slate-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }} className="font-bold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type Props = {
  title: string;
  data?: ChartItemAgrupado[];
  inclinado?: boolean;
  mostrarValores?: boolean;
};

export default function ChartCardAgrupado({
  title,
  data = [],
  inclinado = false,
  mostrarValores = false,
}: Props) {
  console.log(data);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          barGap={0}
          barCategoryGap="20%"
          margin={{
            top: mostrarValores ? 20 : 0,
            right: 30,
            left: 80,
            bottom: inclinado ? 20 : 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis type="number" tick={false} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="nombre"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={140}
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-600 capitalize">{value}</span>
            )}
          />
          <Bar
            dataKey="propias"
            name="Propias"
            barSize={16}
            fill={COLORS.COLOR_PROPIAS}
            radius={[0, 4, 4, 0]}
          >
            {mostrarValores && (
              <LabelList
                dataKey="propias"
                position="right"
                formatter={(v: unknown) => {
                  const n = Number(v);
                  return n > 0 ? n : "";
                }}
                style={{ fontSize: 10, fill: "#475569", fontWeight: 600 }}
              />
            )}
          </Bar>
          <Bar
            dataKey="franquicias"
            name="Franquicias"
            barSize={16}
            fill={COLORS.COLOR_FRANQUICIAS}
            radius={[4, 4, 0, 0]}
          >
            {mostrarValores && (
              <LabelList
                dataKey="franquicias"
                position="right"
                formatter={(v: unknown) => {
                  const n = Number(v);
                  return n > 0 ? n : "";
                }}
                style={{ fontSize: 10, fill: "#475569", fontWeight: 600 }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
