export default function Navbar() {
  return (
    <header className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <span className="font-semibold">Levantamiento</span>

        <nav className="flex gap-4 text-sm">
          <a href="/dashboard" className="hover:text-indigo-300">Dashboard</a>
          <a href="/tecnicos" className="hover:text-indigo-300">Técnicos</a>
          <a href="/farmacias" className="hover:text-indigo-300">Farmacias</a>
        </nav>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span>Jhonny Chamba</span>
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
          JC
        </div>
      </div>
    </header>
  );
}
