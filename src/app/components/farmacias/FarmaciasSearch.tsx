export default function FarmaciasSearch({
  onSearch,
}: {
  onSearch: (v: string) => void;
}) {
  return (
      <input
        type="text"
        placeholder="Buscar farmacia..."
        className="border rounded px-3 py-2 w-64"
        onChange={(e) => onSearch(e.target.value)}
      />
  );
}
