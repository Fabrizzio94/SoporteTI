// /app/actividades/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Usuario } from "@/app/types/tecnico";
import { Actividad } from "@/app/types/actividad";
import ActividadModal from "@/app/components/actividades/ActividadModal";

const FILAS_POR_PAGINA = 8;

export default function ActividadesPage() {
  const { data: session } = useSession();
  const user = session?.user as Usuario;

  // Datos
  const [manuales,    setManuales]    = useState<Actividad[]>([]);
  const [automaticos, setAutomaticos] = useState<Actividad[]>([]);
  const [resumen,     setResumen]     = useState({ total: 0, manuales: 0, automaticos: 0, verificados: 0 });
  const [loading,     setLoading]     = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [farmacia, setFarmacia] = useState("");
  const [tecnico,  setTecnico]  = useState("");
  const [estado,   setEstado]   = useState("");
  const [desde,    setDesde]    = useState("");
  const [hasta,    setHasta]    = useState("");

  // Paginación compartida
  const [pagina, setPagina] = useState(1);

  // Modal
  const [modalOpen,      setModalOpen]      = useState(false);
  const [actividadModal, setActividadModal] = useState<Actividad | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (busqueda) params.set("busqueda", busqueda);
    if (farmacia) params.set("farmacia", farmacia);
    if (tecnico)  params.set("tecnico",  tecnico);
    if (estado)   params.set("estado",   estado);
    if (desde)    params.set("desde",    desde);
    if (hasta)    params.set("hasta",    hasta);

    try {
      const res  = await fetch(`/api/actividades?${params.toString()}`);
      const data = await res.json();
      setManuales(data.manuales    ?? []);
      setAutomaticos(data.automaticos ?? []);
      setResumen(data.resumen      ?? { total: 0, manuales: 0, automaticos: 0, verificados: 0 });
      setPagina(1); // reset paginación al filtrar
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [busqueda, farmacia, tecnico, estado, desde, hasta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Paginación compartida
  const totalPaginas = Math.max(
    Math.ceil(manuales.length    / FILAS_POR_PAGINA),
    Math.ceil(automaticos.length / FILAS_POR_PAGINA)
  );

  const manualesPag    = manuales.slice((pagina - 1) * FILAS_POR_PAGINA, pagina * FILAS_POR_PAGINA);
  const automaticosPag = automaticos.slice((pagina - 1) * FILAS_POR_PAGINA, pagina * FILAS_POR_PAGINA);

  // Alinear filas — el panel más corto rellena con nulls
  const maxFilas = Math.max(manualesPag.length, automaticosPag.length);
  const filasManual = [...manualesPag,    ...Array(maxFilas - manualesPag.length).fill(null)];
  const filasAuto   = [...automaticosPag, ...Array(maxFilas - automaticosPag.length).fill(null)];

  const abrirModal = (actividad: Actividad) => {
    setActividadModal(actividad);
    setModalOpen(true);
  };

  // Badge estado
  const badgeEstado = (a: Actividad) => {
    if (a.tipo_farmacia === "Franquicia")
      return <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">🏪 Franquicia</span>;
    if (a.verificado)
      return <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">✓ Verificado</span>;
    return <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">⏳ Pendiente</span>;
  };

  const badgeAuto = (a: Actividad) => {
    if (a.verificado)
      return <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">✓ Verificado</span>;
    return <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">↻ Auto</span>;
  };

  // Color fila
  const colorFila = (a: Actividad, lado: "manual" | "auto") => {
    if (lado === "manual" && a.tipo_farmacia === "Franquicia")
      return "border-l-2 border-slate-300 bg-slate-50";
    if (a.verificado)
      return "border-l-2 border-emerald-400 bg-emerald-50 hover:bg-emerald-100";
    if (lado === "manual" && !a.verificado)
      return "border-l-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100";
    return "border-l-2 border-transparent hover:bg-slate-50";
  };

  return (
    <div className="p-5 space-y-4">

      {/* TÍTULO */}
      <div>
        <h1 className="text-lg font-bold text-slate-800">Actividades</h1>
        <p className="text-xs text-slate-400">Control de bajas manuales y verificación con carga Excel</p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total registros",  value: resumen.total,       color: "bg-slate-100",  emoji: "📋" },
          { label: "Bajas manuales",   value: resumen.manuales,    color: "bg-violet-50",  emoji: "👤" },
          { label: "Bajas Excel",      value: resumen.automaticos, color: "bg-blue-50",    emoji: "📂" },
          { label: "Verificados",      value: resumen.verificados, color: "bg-emerald-50", emoji: "✅" },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
            <div className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-base shrink-0`}>
              {c.emoji}
            </div>
            <div>
              <p className="text-[10px] text-slate-400">{c.label}</p>
              <p className="text-lg font-bold text-slate-800 leading-tight">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Buscar código activo..."
          className="border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400 w-44"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {user?.role === "COORDINADOR" && (
          <select
            className="border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 outline-none w-36"
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
          >
            <option value="">Técnico: Todos</option>
          </select>
        )}
        <select
          className="border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 outline-none w-36"
          value={farmacia}
          onChange={(e) => setFarmacia(e.target.value)}
        >
          <option value="">Farmacia: Todas</option>
        </select>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          Desde
          <input type="date" className="border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none"
            value={desde} onChange={(e) => setDesde(e.target.value)} />
          Hasta
          <input type="date" className="border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none"
            value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <select
          className="border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 outline-none w-36"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Estado: Todos</option>
          <option value="Verificado">Verificado</option>
          <option value="Pendiente">Pendiente</option>
        </select>
      </div>

      {/* PANELES */}
      <div className="grid grid-cols-2 gap-3">

        {/* PANEL MANUAL */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">● Manual</span>
              <span className="text-xs font-bold text-slate-700">Bajas por Técnico</span>
            </div>
            <span className="text-[11px] text-slate-400">{manuales.length} registros</span>
          </div>

          {/* HEADER COLUMNAS */}
          <div className="grid grid-cols-[80px_1fr_80px_72px] gap-2 px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Código</span>
            <span>Activo · Farmacia</span>
            <span>Motivo</span>
            <span>Estado</span>
          </div>

          {/* FILAS */}
          {loading ? (
            <div className="animate-pulse space-y-0">
              {Array(FILAS_POR_PAGINA).fill(null).map((_, i) => (
                <div key={i} className="h-[52px] border-b border-slate-50 px-4 flex items-center gap-2">
                  <div className="h-3 bg-slate-100 rounded w-16" />
                  <div className="h-3 bg-slate-100 rounded flex-1" />
                </div>
              ))}
            </div>
          ) : (
            filasManual.map((a, i) =>
              a === null ? (
                // FILA RELLENO
                <div key={i} className="h-[52px] border-b border-slate-50"
                  style={{ background: "repeating-linear-gradient(45deg,transparent,transparent 5px,#f8fafc 5px,#f8fafc 10px)" }} />
              ) : (
                <div
                  key={a.id}
                  className={`grid grid-cols-[80px_1fr_80px_72px] gap-2 px-4 h-[52px] border-b border-slate-50 items-center cursor-pointer transition-colors ${colorFila(a, "manual")}`}
                  onClick={() => abrirModal(a)}
                >
                  <span className="font-mono text-[11px] text-indigo-500 font-semibold truncate">{a.codigo_activo}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{a.nombre_activo}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.oficina} · {a.nombre_farmacia}</p>
                    <p className="text-[10px] text-slate-300 truncate">{new Date(a.fecha_baja).toLocaleDateString("es-EC")} · {a.nombre_tecnico}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{a.motivo_baja}</p>
                  {badgeEstado(a)}
                </div>
              )
            )
          )}

          {/* PAGINACIÓN */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {manuales.length === 0 ? "Sin registros" : `${(pagina - 1) * FILAS_POR_PAGINA + 1}-${Math.min(pagina * FILAS_POR_PAGINA, manuales.length)} de ${manuales.length}`}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                className="border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-500 disabled:opacity-40">‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPagina(p)}
                  className={`border rounded px-2 py-0.5 text-[11px] ${pagina === p ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-500"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                className="border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-500 disabled:opacity-40">›</button>
            </div>
          </div>
        </div>

        {/* PANEL AUTOMÁTICO */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">● Excel</span>
              <span className="text-xs font-bold text-slate-700">Bajas por Carga Excel</span>
            </div>
            <span className="text-[11px] text-slate-400">{automaticos.length} registros</span>
          </div>

          {/* HEADER COLUMNAS */}
          <div className="grid grid-cols-[80px_1fr_80px_72px] gap-2 px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Código</span>
            <span>Activo · Farmacia</span>
            <span>Carga</span>
            <span>Estado</span>
          </div>

          {/* FILAS */}
          {loading ? (
            <div className="animate-pulse space-y-0">
              {Array(FILAS_POR_PAGINA).fill(null).map((_, i) => (
                <div key={i} className="h-[52px] border-b border-slate-50 px-4 flex items-center gap-2">
                  <div className="h-3 bg-slate-100 rounded w-16" />
                  <div className="h-3 bg-slate-100 rounded flex-1" />
                </div>
              ))}
            </div>
          ) : (
            filasAuto.map((a, i) => {
              // Verificar si la fila manual correspondiente es franquicia
              const manualCorrespondiente = filasManual[i];
              const esFranquiciaRelleno = manualCorrespondiente !== null &&
                manualCorrespondiente?.tipo_farmacia === "Franquicia";

              return a === null ? (
                // FILA RELLENO — con borde gris si es franquicia
                <div key={i} className={`h-[52px] border-b border-slate-50 ${esFranquiciaRelleno ? "border-l-2 border-slate-300" : ""}`}
                  style={{ background: "repeating-linear-gradient(45deg,transparent,transparent 5px,#f8fafc 5px,#f8fafc 10px)" }} />
              ) : (
                <div
                  key={a.id}
                  className={`grid grid-cols-[80px_1fr_80px_72px] gap-2 px-4 h-[52px] border-b border-slate-50 items-center cursor-pointer transition-colors ${colorFila(a, "auto")}`}
                  onClick={() => abrirModal(a)}
                >
                  <span className="font-mono text-[11px] text-indigo-500 font-semibold truncate">{a.codigo_activo}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{a.nombre_activo}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.oficina} · {a.nombre_farmacia}</p>
                    <p className="text-[10px] text-slate-300 truncate">Excel · {new Date(a.fecha_baja).toLocaleDateString("es-EC")}</p>
                  </div>
                  <p className="text-[10px] text-slate-400">Automático</p>
                  {badgeAuto(a)}
                </div>
              );
            })
          )}

          {/* PAGINACIÓN — mismos controles, mismo estado */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {automaticos.length === 0 ? "Sin registros" : `${(pagina - 1) * FILAS_POR_PAGINA + 1}-${Math.min(pagina * FILAS_POR_PAGINA, automaticos.length)} de ${automaticos.length}`}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                className="border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-500 disabled:opacity-40">‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPagina(p)}
                  className={`border rounded px-2 py-0.5 text-[11px] ${pagina === p ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-500"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                className="border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-500 disabled:opacity-40">›</button>
            </div>
          </div>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex gap-4 flex-wrap text-[11px] text-slate-400">
        {[
          { color: "bg-emerald-400", label: "Verificado — manual + Excel coinciden" },
          { color: "bg-yellow-400",  label: "Pendiente — manual sin Excel aún" },
          { color: "bg-slate-300",   label: "Franquicia — no aplica comparativa" },
          { color: "bg-blue-400",    label: "Auto — solo Excel sin registro manual" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${l.color} shrink-0`} />
            {l.label}
          </div>
        ))}
      </div>

      {/* MODAL */}
      <ActividadModal
        open={modalOpen}
        actividad={actividadModal}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchData(); }}
      />
    </div>
  );
}