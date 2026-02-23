"use client";

export default function TecnicoSearch({
  onSearch,
}: {
  onSearch: (v: string) => void;
}) {
  return (
    <input
      type="text"
      placeholder="Buscar técnico..."
      className="border rounded px-3 py-2 w-64"
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}
