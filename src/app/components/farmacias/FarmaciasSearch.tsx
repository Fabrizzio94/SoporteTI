
export default function FarmaciasSearch({
  onSearch, className
}: {
  onSearch: (v: string) => void;
  className?: string
}) {
  return (
      <input
        type="text"
        placeholder="Buscar farmacia..."
        className={`border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-400 ${className ?? "w-48"}`}
        onChange={(e) => onSearch(e.target.value)}
      />
  );
}
