"use client";
type Props = { onSearch: (value: string) => void; className?: string; };

export default function ActivosSearch({ onSearch, className }: Props) {
  return (
    <input
      type="text"
      placeholder="Buscar código, nombre, farmacia..."
      className={`border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400 ${className ?? "w-48"}`}
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}
