"use client";
type Props = { onSearch: (value: string) => void };

export default function ActivosSearch({ onSearch }: Props) {
  return (
    <input
      type="text"
      placeholder="Buscar código, nombre, farmacia..."
      className="border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400 w-56"
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}
