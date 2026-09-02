import { BarChart3, LucideIcon, Table2 } from "lucide-react";

type Tab = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const TABS: Tab[] = [
  { id: "graficos", label: "Gráficos", icon: BarChart3 },
  { id: "tablas", label: "Tablas", icon: Table2 },
  // { id: "nuevoTab", label: "Tabla 3", icon: AlgunIcono-lucideReact } // para agregar nuevas pestanas al tab.
];

type Props = {
  activa: string;
  onChange: (id: string) => void;
};

export default function TabsNav({ activa, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activa === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={16} strokeWidth={activa === tab.id ? 2.5 : 2} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
