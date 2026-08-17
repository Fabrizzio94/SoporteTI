import { useSession } from "next-auth/react";
import Link from "next/link";
export default function pedidosEquiposPage() {
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>
      </div>

      <a
        href="https://forms.office.com/pages/responsepage.aspx?id=h_lCj9ropEaofjD-gEwcyBHi6U0Txu1Kv4ZqO8eEsFhUMTYyN0dJOVhHQVJPR1lRTkU5QlNSODlTTS4u&route=shorturl"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit" }}
        className="inline-block bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-200 hover:shadow-md transition-all duration-200 border border-indigo-200"
      >
        Pedido de Equipos
      </a>
    </main>
  );
}
