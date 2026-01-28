"use client";

import TecnicosTable from "@/app/components/tecnicos/TecnicosTable";
import TecnicoModal from "@/app/components/tecnicos/TecnicosModal";
import TecnicoSearch from "@/app/components/tecnicos/TecnicoSearch";
import { Tecnico } from "@/app/types/tecnico";
import { useState, useEffect } from "react";

export default function TecnicosPage() {
  const [search, setSearch] = useState("");
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] =
    useState<Partial<Tecnico> | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const registroPorPagina = 10;

  const refreshData = () => {
    fetch("/api/tecnicos")
      .then((res) => res.json())
      .then((data) => setTecnicos(Array.isArray(data) ? data : []));
  };
  useEffect(() => {
    fetch("/api/tecnicos")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTecnicos(data);
        } else {
          console.error("API devolvio error: ", data);
          setTecnicos([]);
        }
      });
  }, []);
  useEffect(() => {
    setPaginaActual(1);
  }, [search, mostrarInactivos]);

  const filtered = tecnicos.filter((t) => {
    const cumpleBusqueda =
      t.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) ||
      t.cedula.includes(search) ||
      t.usuario.toLowerCase().includes(search.toLowerCase());
    const cumpleEstado = mostrarInactivos ? true : t.estado === "A";
    return cumpleBusqueda && cumpleEstado;
  });

  // PAGINACION TECNICOS
  const ultimoIndice = paginaActual * registroPorPagina;
  const primerIndice = ultimoIndice - registroPorPagina;

  const tecnicosPaginados = filtered.slice(primerIndice, ultimoIndice);
  const totalPaginas = Math.ceil(filtered.length / registroPorPagina);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Técnicos</h1>
      <div className="flex justify-between items-cente mb-4">
        <TecnicoSearch onSearch={setSearch} />
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
            {/*           <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
             */}{" "}
          </label>
          <button
            onClick={() => setTecnicoSeleccionado({})}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            + Agregar
          </button>
        </div>
        <TecnicoModal
          open={!!tecnicoSeleccionado}
          tecnico={
            tecnicoSeleccionado?.cedula
              ? (tecnicoSeleccionado as Tecnico)
              : null
          }
          onClose={() => setTecnicoSeleccionado(null)}
          onSaved={() => {
            setTecnicoSeleccionado(null);
            refreshData();
          }}
        />
      </div>

      <TecnicosTable
        tecnicos={tecnicosPaginados}
        onEdit={(t) => setTecnicoSeleccionado(t)}
      />
      {/* paginacion de tecnicos */}
      <div className="mt-8 flex flex-col items-center gap-4">
        {/* Texto informativo 
        <p className="text-sm text-slate-500">
          Mostrando página <b>{paginaActual}</b> de <b>{totalPaginas}</b>
        </p>*/}

        {/* Contenedor de botones centrado */}
        <div className="flex items-center space-x-1">
          {/* Botón Anterior */}
          <button
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1}
            className="rounded-md border border-slate-300 py-2 px-3 text-sm shadow-sm hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-all"
          >
            Prev
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
            Next
          </button>
        </div>
      </div>

      {/* fin paginacion de tecnicos */}
    </main>
  );
}
