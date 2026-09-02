"use client";
import { useState } from "react";
import PedidosTabsNav from "../components/pedidos/TabsNav";
export default function pedidosEquiposPage() {
  const [tab, setTab] = useState("equipos");
  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>
      </div>
      <PedidosTabsNav activa={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === "equipos" && (
          <a
            href="https://forms.office.com/pages/responsepage.aspx?id=h_lCj9ropEaofjD-gEwcyBHi6U0Txu1Kv4ZqO8eEsFhUMTYyN0dJOVhHQVJPR1lRTkU5QlNSODlTTS4u&route=shorturl"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
            className="inline-block bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-200 hover:shadow-md transition-all duration-200 border border-indigo-200"
          >
            Pedido de Equipos
          </a>
        )}

        {tab === "insumos" && (
          <a
            href="https://forms.cloud.microsoft/pages/responsepage.aspx?id=h_lCj9ropEaofjD-gEwcyBHi6U0Txu1Kv4ZqO8eEsFhUNjdIQjNHQk5OTVk4UU9WOE1PTVFPUFM4NC4u&route=shorturl"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
            className="inline-block bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-200 hover:shadow-md transition-all duration-200 border border-indigo-200"
          >
            Pedido de Insumos
          </a>
        )}
        {tab === "diferidos" && (
          <a
            href="https://forms.cloud.microsoft/pages/responsepage.aspx?id=h_lCj9ropEaofjD-gEwcyBHi6U0Txu1Kv4ZqO8eEsFhUQzRaTUkzWUtPRkMyRFVCWkdCQklXTEJIQi4u&route=shorturl"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
            className="inline-block bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-200 hover:shadow-md transition-all duration-200 border border-indigo-200"
          >
            Diferidos
          </a>
        )}
      </div>
    </main>
  );
}
