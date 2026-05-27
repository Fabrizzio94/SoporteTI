// /app/actividades/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Usuario } from "@/app/types/tecnico";
import { Actividad } from "@/app/types/actividad";
import ActividadModal from "@/app/components/actividades/ActividadModal";

const FILAS_POR_PAGINA = 10;

const badgeEstado = (a: Actividad) => {
  if (a.motivo_baja === "Reactivado — vuelve a aparecer en carga Excel")
    return (
      <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700">
        ↩ Reactivado
      </span>
    );
  if (a.tipo_farmacia === "Franquicia")
    return (
      <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        🏪 Franquicia
      </span>
    );
  if (a.tipo_baja === "MANUAL" && a.verificado)
    return (
      <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
        ✓ Verificado
      </span>
    );
  if (a.tipo_baja === "MANUAL" && !a.verificado)
    return (
      <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
        ⏳ Pendiente
      </span>
    );
  return (
    <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
      ✓ Automatico
    </span>
  );
};

const badgeTipo = (a: Actividad) => (
  <span
    className={`inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
      a.tipo_baja === "MANUAL"
        ? "bg-violet-50 text-violet-700"
        : "bg-blue-50 text-blue-700"
    }`}
  >
    ● {a.tipo_baja === "MANUAL" ? "Manual" : "Automatico"}
  </span>
);

export default function ActividadesPage() {
  const { data: session } = useSession();
  const user = session?.user as Usuario;

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [resumen, setResumen] = useState({
    total: 0,
    manuales: 0,
    automaticos: 0,
    verificados: 0,
    pendientes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tecnicos, setTecnicos] = useState<
    { cedula: string; nombreCompleto: string }[]
  >([]);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [farmacia, setFarmacia] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Paginación
  const [pagina, setPagina] = useState(1);
  //const [paginaActual, setPaginaActual] = useState(1);
  const [registroPorPagina, setRegistroPorPagina] = useState(10);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [actividadModal, setActividadModal] = useState<Actividad | null>(null);

  // Cargar técnicos para filtro coordinador
  useEffect(() => {
    if (user?.role === "COORDINADOR") {
      fetch("/api/tecnicos")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTecnicos(
              data.map((t) => ({
                cedula: t.cedula,
                nombreCompleto: `${t.apellidos} ${t.nombres}`,
              })),
            );
          }
        });
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (busqueda) params.set("busqueda", busqueda);
    if (farmacia) params.set("farmacia", farmacia);
    if (tecnico) params.set("tecnico", tecnico);
    if (estado) params.set("estado", estado);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);

    try {
      const res = await fetch(`/api/actividades?${params.toString()}`);
      const data = await res.json();
      setActividades(data.actividades ?? []);
      setResumen(
        data.resumen ?? {
          total: 0,
          manuales: 0,
          automaticos: 0,
          verificados: 0,
          pendientes: 0,
        },
      );
      setPagina(1);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [busqueda, farmacia, tecnico, estado, desde, hasta]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPaginas = Math.ceil(actividades.length / registroPorPagina);
  const filtered = actividades.filter((t) => {
    const cumpleBusqueda =
      t.codigo_activo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.oficina.includes(busqueda) ||
      t.nombre_tecnico?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.nombre_activo.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleBusqueda;
  });
  // PAGINACION
  const primerIndice = (pagina - 1) * registroPorPagina;
  const ultimoIndice = pagina * registroPorPagina;
  const activosPaginados = actividades.slice(primerIndice, ultimoIndice);
  const abrirModal = (a: Actividad) => {
    setActividadModal(a);
    setModalOpen(true);
  };

  return (
    <div className="p-5 space-y-4">
      {/* TÍTULO */}
      <div>
        <h1 className="text-lg font-bold text-slate-800">Actividades</h1>
        <p className="text-xs text-slate-400">
          Historial de bajas y verificación con carga Excel
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-5 gap-3">
        {[
          {
            label: "Total",
            value: resumen.total,
            color: "bg-slate-100",
            emoji: "📋",
          },
          {
            label: "Manuales",
            value: resumen.manuales,
            color: "bg-violet-50",
            emoji: "👤",
          },
          {
            label: "Automaticos",
            value: resumen.automaticos,
            color: "bg-blue-50",
            emoji: "📂",
          },
          {
            label: "Verificados",
            value: resumen.verificados,
            color: "bg-emerald-50",
            emoji: "✅",
          },
          {
            label: "Pendientes",
            value: resumen.pendientes,
            color: "bg-orange-50",
            emoji: "⏳",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3"
          >
            <div
              className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-base shrink-0`}
            >
              {c.emoji}
            </div>
            <div>
              <p className="text-[10px] text-slate-400">{c.label}</p>
              <p className="text-lg font-bold text-slate-800 leading-tight">
                {c.value}
              </p>
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
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
        />
        {user?.role === "COORDINADOR" && (
          <select
            className="border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 outline-none w-40"
            value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
          >
            <option value="">Técnico: Todos</option>
            {tecnicos.map((t) => (
              <option key={t.cedula} value={t.cedula}>
                {t.nombreCompleto}
              </option>
            ))}
          </select>
        )}
        <select
          className="border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 outline-none w-36"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Estado: Todos</option>
          <option value="Verificado">Verificado</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Automatico">Automatico</option>
          <option value="Reactivado">Reactivado</option>
        </select>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          Desde
          <input
            type="date"
            className="border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          Hasta
          <input
            type="date"
            className="border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Código
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Activo
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Farmacia
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Fecha Baja
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Motivo
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Técnico
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Cód. Anterior
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(FILAS_POR_PAGINA)
                .fill(null)
                .map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 animate-pulse"
                  >
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </td>
                  </tr>
                ))
            ) : activosPaginados.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-slate-400 text-xs"
                >
                  Sin registros
                </td>
              </tr>
            ) : (
              activosPaginados.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => abrirModal(a)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] text-indigo-500 font-semibold">
                      {a.codigo_activo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-700">
                      {a.nombre_activo}
                    </div>
                    <div className="mt-0.5">{badgeTipo(a)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{a.nombre_farmacia}</div>
                    <div className="text-[10px] text-slate-400">
                      {a.oficina}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {new Date(a.fecha_baja).toLocaleDateString("es-EC")}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">
                    {a.motivo_baja ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {a.nombre_tecnico ?? "Automatico"}
                  </td>
                  <td className="px-4 py-3">
                    {a.codigo_reemplazo ? (
                      <span className="font-mono text-[10px] text-slate-400">
                        {a.codigo_reemplazo}
                      </span>
                    ) : (
                      <span className="text-slate-200">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{badgeEstado(a)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100">
          <div className="flex gap-3 px-4 py-2.5 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {actividades.length === 0
                ? "Sin registros"
                : `${(pagina - 1) * FILAS_POR_PAGINA + 1}–${Math.min(pagina * FILAS_POR_PAGINA, actividades.length)} de ${actividades.length}`}
            </span>
            <select
              className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-600"
              value={registroPorPagina}
              onChange={(e) => {
                setRegistroPorPagina(Number(e.target.value));
                setPagina(1);
              }}
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
          {/* Contenedor de botones centrado */}
          <div className="flex items-center space-x-1">
            {/* Botón Anterior */}
            <button
              onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
              disabled={pagina === 1}
              className="rounded-md border border-slate-300 py-2 px-3 text-sm shadow-sm hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-all"
            >
              Anterior
            </button>

            {/* Renderizado de números con Elipsis */}
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
              (num) => {
                // Lógica de Elipsis: Mostrar siempre primera, última y las 2 alrededor de la actual
                if (
                  num === 1 ||
                  num === totalPaginas ||
                  (num >= pagina - 1 && num <= pagina + 1)
                ) {
                  return (
                    <button
                      key={num}
                      onClick={() => setPagina(num)}
                      className={`min-w-9 rounded-md py-2 px-3 text-sm transition-all ${
                        pagina === num
                          ? "bg-slate-800 text-white shadow-md"
                          : "border border-slate-300 text-slate-600 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {num}
                    </button>
                  );
                }

                // Mostrar puntos suspensivos solo una vez en cada hueco
                if (num === pagina - 2 || num === pagina + 2) {
                  return (
                    <span key={num} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }

                return null;
              },
            )}

            {/* Botón Siguiente */}
            <button
              onClick={() =>
                setPagina((prev) => Math.min(prev + 1, totalPaginas))
              }
              disabled={pagina === totalPaginas}
              className="rounded-md border border-slate-300 py-2 px-3 text-sm shadow-sm hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-all"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex gap-4 flex-wrap text-[11px] text-slate-400">
        {[
          {
            color: "bg-emerald-400",
            label: "Verificado — manual confirmado por Excel",
          },
          {
            color: "bg-yellow-400",
            label: "Pendiente — manual sin confirmación Excel",
          },
          {
            color: "bg-blue-400",
            label: "Automatico — Excel detectó sin baja manual",
          },
          {
            color: "bg-pink-400",
            label: "Reactivado — equipo vuelve en Excel",
          },
          {
            color: "bg-slate-300",
            label: "Franquicia — sin comparativa Excel",
          },
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
        onSaved={() => {
          setModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
