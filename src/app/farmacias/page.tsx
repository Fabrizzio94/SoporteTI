"use client";
import FarmaciasSearch from "../components/farmacias/FarmaciasSearch";
import FarmaciaModal from "../components/farmacias/FarmaciasModal";
import { Farmacia } from "@/app/types/farmacia";
import { useState, useEffect, useRef } from "react";
import FarmaciasTable from "../components/farmacias/FarmaciasTable";
import { useSession } from "next-auth/react";
import { RefreshCcw } from "lucide-react";  // para iconos svg refresh
import toast from "react-hot-toast";
export default function FarmaciasPage() {
  const [search, setSearch] = useState("");
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [farmaciasSeleccionada, setFarmaciaSeleccionada] =
    useState<Partial<Farmacia> | null>(null);
  // toggle para mostrar inactivos
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  // Ref para detectar clic afuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  // paginacion
  const [paginaActual, setPaginaActual] = useState(1);
  const registroPorPagina = 20;
  // manejo de sesion login para filtrar por usuario que ingrese
  const { data: session } = useSession();
  const [isSyn, setIsSyn] = useState(false);
  const user = session?.user as { role?: string; name?: string };
  // mostrar conteo por tecnico en dropdown-label
  const [mostrarConteo, setMostrarConteo] = useState(false);
  const refreshData = () => {
    fetch("/api/farmacias")
      .then((res) => res.json())
      .then((data) => setFarmacias(Array.isArray(data) ? data : []));
  };
  const handleSincronizar = async () => {
    setIsSyn(true);
    const promise = fetch("/api/farmacias/sync",{ method: "POST"})
    .then(async (res) => {
      console.log(res);
      if(!res.ok) throw new Error("Error en la red");
      return res.json();
    });
    await toast.promise(promise, {
      loading: "Sincronizando con Matriz...",
      success: (data) => `Sincronizacion completa, se procesaron ${data.count} farmacias.`,
      error: "Error al sincronizar, verifica conexion al dominio."
    });
    setIsSyn(false);
    refreshData();
  }
  useEffect(() => {
    fetch("/api/farmacias")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFarmacias(data);
        } else {
          console.error("API devolvio error: ", data);
          setFarmacias([]);
        }
      });
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [search, mostrarInactivos]);
  // useEffect para clic fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if(dropdownRef.current && !dropdownRef.current.contains(e.target as Node)){
        setMostrarConteo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filtered = farmacias.filter((t) => {
    const cumpleBusqueda =
      t.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      t.oficina.includes(search) ||
      t.marca.toLowerCase().includes(search.toLowerCase());
    const cumpleEstado = mostrarInactivos ? true : t.estado === "A";
    return cumpleBusqueda && cumpleEstado;
  });
  // CONTEO DE FARMACIAS EN ETIQUETA PARA INFORMACION
  const conteoTotal = filtered.length;
  const conteoPorTecnico = filtered.reduce((acc, f) => {
    const tecnico = f.nombreTecnico || "Sin asignar";
    acc[tecnico]= (acc[tecnico] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
  // PAGINACION TECNICOS
  const ultimoIndice = paginaActual * registroPorPagina;
  const primerIndice = ultimoIndice - registroPorPagina;

  const farmaciasPaginadas = filtered.slice(primerIndice, ultimoIndice);
  const totalPaginas = Math.ceil(filtered.length / registroPorPagina);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Farmacias</h1>
      <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm mb-4 flex-wrap">
        <div className="flex justify-between items-cente mb-1">
          <FarmaciasSearch onSearch={setSearch} />
        </div>
        {/*<div className="w-px h-6 bg-slate-200" />  separador */}

        {/* Contador — antes de FarmaciasTable */}
        <div className="flex flex-wrap items-center gap-3">
          {user?.role === "COORDINADOR" && (
            <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
              Total: <b>{conteoTotal}</b> farmacia{conteoTotal !== 1 ? "s" : ""}
            </span>
          )}
          <div className="w-px h-6 bg-slate-200" /> {/* separador */}
          {user?.role === "COORDINADOR" && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMostrarConteo(!mostrarConteo)}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium flex items-center gap-2"
              >
                Total: farmacias por tecnico
                <span>{mostrarConteo ? "▲" : "▼"}</span>
              </button>

              {mostrarConteo && (
                <div className="absolute top-8 left-0 z-10 bg-white border border-slate-200 rounded-lg shadow-xl p-2 min-w-108 max-h-84 overflow-y-auto">
                  {Object.entries(conteoPorTecnico)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([tecnico, count]) => (
                      <div
                        key={tecnico}
                        className="flex justify-between text-sm px-2 py-1 hover:bg-lime-300 rounded"
                      >
                        <span className="text-slate-700 group-hover:text-indigo-700 group-hover:font-medium transition-colors">{tecnico}</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-200 group-hover:text-indigo-800 px-2 py-0.5 rounded-full ml-4 transition-colors">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {user?.role === "TECNICO" && (
            // Técnico solo ve su conteo
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              Tus farmacias: <b>{conteoTotal}</b>
            </span>
          )}
        </div>
        <div className="flex items-center gap-14">
          <label className="flex items-center cursor-pointer gap-2 bg-gray-100 p-2 rounded-md">
            <span className="text-sm font-medium text-gray-700">
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
            <button
              onClick={handleSincronizar}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md shadow transition-all"
            >
              <RefreshCcw
                className={`w-4 h-4 ${isSyn ? "animate-spin" : ""}`}
              />
              {isSyn ? "Sincronizando..." : "Sincronizar Matriz"}
            </button>
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
      <FarmaciasTable
        farmacias={farmaciasPaginadas}
        onEdit={(t) => setFarmaciaSeleccionada(t)}
      />
      {/* paginacion de farmacias */}
      <div className="mt-8 flex flex-col items-center gap-4">
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
