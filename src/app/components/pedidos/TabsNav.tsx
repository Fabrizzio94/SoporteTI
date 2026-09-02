import { LucideIcon, Package, Layers, Cpu, HandCoins } from "lucide-react";

type PillTab = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const PEDIDO_TABS: PillTab[] = [
  { id: "equipos", label: "Pedido Equipos", icon: Cpu },
  { id: "insumos", label: "Pedido Insumos", icon: Package },
  { id: "diferidos", label: "Diferidos", icon: HandCoins },
  // { id: "nuevoTab", label: "Tabla 3", icon: AlgunIcono-lucideReact } // para agregar nuevas pestanas al tab.
];

type Props = {
  activa: string;
  onChange: (id: string) => void;
};

export default function PedidosTabsNav({ activa, onChange }: Props) {
  return (
    <div className="inline-flex gap-1 border-b border-slate-200">
      {PEDIDO_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activa === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
