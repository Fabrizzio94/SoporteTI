type Tab = {
  id: string;
  label: string;
};

const TABS: Tab[] = [
  { id: "graficos", label: "Gráficos" },
  { id: "tablas", label: "Tablas" },
  // { id: "nuevoTab", label: "Tabla 3" } // para agregar nuevas pestanas al tab.
];

type Props = {
  activa: string;
  onChange: (id: string) => void;
};

export default function TabsNav({ activa, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activa === tab.id
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
