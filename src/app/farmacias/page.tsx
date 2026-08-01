"use client";
import FarmaciasSearch from "../components/farmacias/FarmaciasSearch";
import FarmaciaModal from "../components/farmacias/FarmaciasModal";
import { Farmacia } from "@/app/types/farmacia";
import { useState, useEffect, useRef, useCallback } from "react";
import FarmaciasTable from "../components/farmacias/FarmaciasTable";
import { useSession } from "next-auth/react";
import { RefreshCcw, FileSpreadsheet } from "lucide-react"; // para iconos svg refresh
import toast from "react-hot-toast";
import { useDebounce } from "../hooks/useDebounce";
export default function FarmaciasPage() {
  // ------------------- ESTADOS -----------------------
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [farmaciasSeleccionada, setFarmaciaSeleccionada] =
    useState<Partial<Farmacia> | null>(null);
  // toggle para mostrar inactivos
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [habilitarBoton, setHabilitarBoton] = useState(false); // maneja boton para habilitar despues de sincronizar
  // Ref para detectar clic afuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  // paginacion
  const [registroPorPagina, setRegistroPorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);
  // manejo de sesion login para filtrar por usuario que ingrese
  const { data: session } = useSession();
  const [isSyn, setIsSyn] = useState(false);
  const user = session?.user as { role?: string; name?: string };
  // mostrar conteo por tecnico en dropdown-label
  const [mostrarConteo, setMostrarConteo] = useState(false);
  // estados de tecnicos para filtrar por desplegable
  const [tecnicoFiltro, setTecnicoFiltro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [conteoPropia, setConteoPropia] = useState(0);
  const [conteoFranquicia, setConteoFranquicia] = useState(0);
  const [conteoPorTecnico, setConteoPorTecnico] = useState<
    { tecnico: string; total: number }[]
  >([]);
  const [isExportando, setIsExportando] = useState(false);
  //************************************************************************ */
  const refreshData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("busqueda", debouncedSearch);
    params.set("page", paginaActual.toString());
    params.set("limit", registroPorPagina.toString());
    params.set("estado", mostrarInactivos ? "I" : "A");
    if (tecnicoFiltro) params.set("tecnico", tecnicoFiltro);
    try {
      const res = await fetch(`/api/farmacias?${params.toString()}`);
      const data = await res.json();
      setFarmacias(data.data ?? []);
      setTotal(data.total ?? 0);
      setConteoPropia(data.stats.propias);
      setConteoFranquicia(data.stats.franquicias);
      setConteoPorTecnico(data.conteoTecnicos);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    paginaActual,
    registroPorPagina,
    mostrarInactivos,
    tecnicoFiltro,
  ]);
  const handleSincronizar = async () => {
    setIsSyn(true);
    setHabilitarBoton(true);
    try {
      const promise = fetch("/api/farmacias/sync", { method: "POST" }).then(
        async (res) => {
          console.log(res);
          if (!res.ok) throw new Error("Error en la red");
          return res.json();
        },
      );
      await toast.promise(promise, {
        loading: "Sincronizando con Matriz...",
        success: (data) =>
          `Sincronizacion completa, se procesaron ${data.count} farmacias.`,
        error: "Error al sincronizar, verifica conexion al dominio.",
      });
      refreshData();
    } finally {
      setIsSyn(false);
      setHabilitarBoton(false);
    }
  };
  const handlerExportar = useCallback(() => {
    window.location.href = "/api/farmacias/exportar";
  }, []);
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedSearch, registroPorPagina, mostrarInactivos]);
  // useEffect para clic fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMostrarConteo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const conteoTotal = total;

  const totalPaginas = Math.ceil(total / registroPorPagina);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Farmacias</h1>

      <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm mb-4 flex items-center gap-2">
        {/* BLOQUE IZQUIERDO: envuelve internamente, nunca desplaza al derecho */}
        <FarmaciasSearch onSearch={setSearch} className="wd-32 md:w-48" />
        <div className="flex flex-wrap items-center justify-center gap-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === "COORDINADOR" && (
              <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
                Total: <b>{conteoTotal}</b> farmacia
                {conteoTotal !== 1 ? "s" : ""}
              </span>
            )}
            <div className="w-px h-6 bg-slate-200" />
            <span className="text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-medium">
              Propias: <b>{conteoPropia}</b>
            </span>
            <span className="text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
              Franquicias: <b>{conteoFranquicia}</b>
            </span>
            <div className="w-px h-6 bg-slate-200" />
          </div>

          {user?.role === "COORDINADOR" && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setMostrarConteo(!mostrarConteo)}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium flex items-center gap-2 max-w-[220px]"
              >
                <span className="truncate">
                  {tecnicoFiltro
                    ? `${tecnicoFiltro}`
                    : "Total: farmacias por tecnico"}
                </span>
                <span className="shrink-0">{mostrarConteo ? "▲" : "▼"}</span>
              </button>

              {mostrarConteo && (
                <div className="absolute top-8 left-0 z-10 bg-white border border-slate-200 rounded-lg shadow-xl p-2 min-w-108 max-h-84 overflow-y-auto">
                  {tecnicoFiltro && (
                    <div
                      onClick={() => {
                        setTecnicoFiltro(null);
                        setMostrarConteo(false);
                      }}
                      className="flex justify-center text-sm px-2 py-1 mb-1 hover:bg-red-50 text-red-500 rounded cursor-pointer border-b border-slate-100"
                    >
                      Quitar Filtro
                    </div>
                  )}
                  {conteoPorTecnico.map(({ tecnico, total }) => (
                    <div
                      key={tecnico}
                      onClick={() => {
                        setTecnicoFiltro(tecnico);
                        setMostrarConteo(false);
                      }}
                      className="flex justify-between text-sm px-2 py-1 hover:bg-lime-300 rounded"
                    >
                      <span className="text-slate-700 group-hover:text-indigo-700 group-hover:font-medium transition-colors">
                        {tecnico}
                      </span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-200 group-hover:text-indigo-800 px-2 py-0.5 rounded-full ml-4 transition-colors">
                        {total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user?.role === "TECNICO" && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              Tus farmacias: <b>{conteoTotal}</b>
            </span>
          )}
        </div>

        {/* BLOQUE DERECHO: siempre en la misma fila, nunca se desplaza */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center cursor-pointer gap-2 bg-gray-100 p-2 rounded-md shrink-0">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Ver Inactivos
            </span>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={mostrarInactivos}
              onChange={() => setMostrarInactivos(!mostrarInactivos)}
            />
            <div className="relative w-9 h-5 bg-neutral-quaternary rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
          </label>

          {user?.role === "COORDINADOR" && (
            <>
              <button
                disabled={habilitarBoton}
                onClick={handleSincronizar}
                title="Sincronizar Matriz"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2 lg:px-4 lg:py-2 rounded-md shadow transition-all shrink-0 disabled:opacity-50"
              >
                <RefreshCcw
                  className={`w-4 h-4 shrink-0 ${isSyn ? "animate-spin" : ""}`}
                />
                <span className="hidden xl:inline whitespace-nowrap">
                  {isSyn ? "Sincronizando..." : "Sincronizar Matriz"}
                </span>
              </button>

              <button
                disabled={isExportando}
                onClick={handlerExportar}
                title="Exportar a Excel"
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white p-2 lg:px-4 lg:py-2 rounded-md shadow transition-all shrink-0 disabled:opacity-50"
              >
                <FileSpreadsheet
                  className={`w-4 h-4 shrink-0 ${isExportando ? "animate-pulse" : ""}`}
                />
                <span className="hidden xl:inline whitespace-nowrap">
                  {isExportando ? "Exportando..." : "Exportar"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
      <FarmaciaModal
        open={!!farmaciasSeleccionada}
        farmacia={
          farmaciasSeleccionada?.oficina
            ? (farmaciasSeleccionada as Farmacia)
            : null
        }
        onClose={() => setFarmaciaSeleccionada(null)}
        onSaved={() => {
          setFarmaciaSeleccionada(null);
          refreshData();
        }}
      />
      {loading ? (
        <div className="space-y-2 mt-4">
          {[...Array(registroPorPagina)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <FarmaciasTable
          farmacias={farmacias}
          onEdit={(t) => setFarmaciaSeleccionada(t)}
        />
      )}

      {/* paginacion de farmacias */}
      <div className="mt-6 flex items-center justify-between">
        <select
          className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-600"
          value={registroPorPagina}
          onChange={(e) => {
            setRegistroPorPagina(Number(e.target.value));
            setPaginaActual(1);
          }}
        >
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
        {/* Contenedor de botones centrado */}
        <div className="flex items-center space-x-1">
          {/* Botón Anterior */}
          <button
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1}
            className="rounded-md border border-slate-300 py-2 px-3 text-sm shadow-sm hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-all"
          >
            Anterior
          </button>

          {/* Renderizado de números con Elipsis */}
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
            // Lógica de Elipsis: Mostrar siempre primera, última y las 2 alrededor de la actual
            if (
              num === 1 ||
              num === totalPaginas ||
              (num >= paginaActual - 1 && num <= paginaActual + 1)
            ) {
              return (
                <button
                  key={num}
                  onClick={() => setPaginaActual(num)}
                  className={`min-w-9 rounded-md py-2 px-3 text-sm transition-all ${
                    paginaActual === num
                      ? "bg-slate-800 text-white shadow-md"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {num}
                </button>
              );
            }

            // Mostrar puntos suspensivos solo una vez en cada hueco
            if (num === paginaActual - 2 || num === paginaActual + 2) {
              return (
                <span key={num} className="px-1 text-slate-400">
                  ...
                </span>
              );
            }

            return null;
          })}

          {/* Botón Siguiente */}
          <button
            onClick={() =>
              setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
            }
            disabled={paginaActual === totalPaginas}
            className="rounded-md border border-slate-300 py-2 px-3 text-sm shadow-sm hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-all"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* fin paginacion de tecnicos */}
    </main>
  );
}
