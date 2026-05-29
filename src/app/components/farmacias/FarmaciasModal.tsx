"use client";

import { Farmacia } from "@/app/types/farmacia";
import { tree } from "next/dist/build/templates/app-page";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Tecnico } from "@/app/types/tecnico";
type Props = {
  open: boolean;
  farmacia?: Farmacia | null;
  onClose: () => void;
  onSaved: () => void;
};
export default function FarmaciaModal({
  farmacia,
  onClose,
  onSaved,
  open,
}: Props) {
  // variables farmacia
  const [oficina, setOficina] = useState("");
  const [nombre, setNombre] = useState("");
  const [nombreTecnico, setNombreTecnico] = useState("");
  const [tipoFarmacia, setTipoFarmacia] = useState("");
  const [marca, setMarca] = useState("");
  //const [anoApertura, setAnoApertura] = useState("");
  const [tecnologiaTerminales, setTecnologiaTerminales] = useState("");
  const [soTerminales, setSoTerminales] = useState("");
  const [numPuntosVenta, setNumPuntoVenta] = useState(0);
  const [tipoRack, setTipoRack] = useState("");
  const [estado, setEstado] = useState<string>("A");
  const date = new Date();
  // variables tecnicos listar fetch
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cedulaTecnico, setCedulaTecnico] = useState("");
  // variables para manejar insercion de datos de servidor(activos)
  const [soServidor, setSoServidor] = useState("");
  const [virtualizer, setVirtualizer] = useState("");
  const [ram, setRam] = useState<number | "">("");
  const [tipoRamSrv, setTipoRamSrv] = useState("");
  const [tab, setTab] = useState<"general" | "servidor">("general");
  // variable para skeleton
  const [loading, setLoading] = useState(true);
  // variables datos
  const listaTecnoTerminales = [
    "AMD-1",
    "AMD-2",
    "AMD-3",
    "AMD-4",
    "AMD-5",
    "GA-690",
    "GI-945",
    "OVALADAS",
    "CPU",
    "INTCEL-2022",
    "INTCEL-2025 (v2)",
    "N/A",
  ];
  const listaSoTerminales = ["WIN 10", "WIN XP", "N/A"];
  const listadoVirtualizer = ["VMware", "BootManager", "N/A"];
  const listadoSoSrv = ["WS-2022", "WS-2019", "WS-2016"];
  const listadoTipoRam = ["DDR4", "DDR3"];
  const listadoTipoRack = ["3 NIVELES", "2 NIVELES", "GABINETE", "SIN RACK"];
  // HOOKS
  useEffect(() => {
    // fetch para traer consulta de tecnicos
    setLoading(true);
    const start = Date.now();
    if (open) {
      fetch("/api/tecnicos")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const dataConvertida = data.map((t) => ({
              ...t,
              nombreCompleto: `${t.apellidos} ${t.nombres}`,
            }));
            setTecnicos(dataConvertida);
          }
        })
        .finally(() => {
          const elapsed = Date.now() - start;
          const remaining = Math.max(0, 600 - elapsed);
          setTimeout(() => setLoading(false), remaining);
        });
    }
  }, [open]);
  useEffect(() => {
    if (farmacia) {
      setOficina(farmacia.oficina ?? "");
      setNombre(farmacia.nombre ?? "");
      setCedulaTecnico(farmacia.cedula_tecnico || "");
      setTipoFarmacia(farmacia.tipo_farmacia ?? "");
      setMarca(farmacia.marca ?? "");
      setTecnologiaTerminales(farmacia.tecnologia_terminales ?? "");
      setSoTerminales(farmacia.ssoo_terminales ?? "");
      setNumPuntoVenta(farmacia.num_puntos_venta || 0);
      setTipoRack(farmacia.tipo_rack ?? "");
      setEstado(farmacia.estado ?? "");
      // En useEffect agrega:
      setSoServidor(
        listadoSoSrv.includes(farmacia.so_servidor ?? "")
          ? (farmacia.so_servidor ?? "")
          : "",
      );
      setVirtualizer(farmacia.virtualizer ?? "");
      setRam(farmacia.ram ?? "");
      setTipoRamSrv(farmacia.tipo_ram ?? "");
      setTimeout(() => setLoading(false), 400);
    } else {
      setOficina("");
      setNombre("");
      setCedulaTecnico(""); // combo box con tecnicos existentes
      setTipoFarmacia("Propia");
      setMarca("ECONOMICA");
      setTecnologiaTerminales("INCEL-2025");
      setSoTerminales("WIN 10");
      setNumPuntoVenta(2);
      setTipoRack("3 Niveles");
      setEstado("A");
    }
  }, [farmacia, open]);

  const handleSubmit = async () => {
    if (!oficina || !nombre || !cedulaTecnico) {
      //alert("Por favor, complete los campos obligatorios");
      toast.error("Por favor, complete los campos obligatorios");
      return;
    }
    const loadingToast = toast.loading("Guardando Registro...");
    try {
      // campos farmacia
      const response = await fetch("/api/farmacias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oficina,
          tecnologiaTerminales,
          soTerminales,
          soServidor,
          numPuntosVenta,
          tipoRack,
          estado,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Error al actualizar farmacia");
      }
      // llamada activos para farmacias con CPU principal
      if (farmacia?.codigo_servidor) {
        const resSrv = await fetch("/api/activos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo_activo: farmacia.codigo_servidor,
            nombre_activo: "CPU",
            ano_compra: farmacia.ano_servidor ?? null,
            descripcion: null,
            oficina: farmacia.oficina,
            so_servidor: soServidor || null,
            virtualizer: virtualizer || null,
            ram: ram !== "" ? Number(ram) : null,
            tipo_ram: tipoRamSrv || null,
            es_principal: true,
          }),
        });
        if (!resSrv.ok) {
          const data = await resSrv.json();
          throw new Error(data.error ?? "Error al actualizar datos servidor");
        }
      }
      // solo arroja el toast cuando pasa cualquiera de los 2 para marca resultado ok
      toast.success("Actualizado correctamente", { id: loadingToast });
      onSaved();
    } catch (error) {
      toast.error("Hubo un error al procesar la solicitud", {
        id: loadingToast,
      });
    }
  };
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl max-h-[90vh] flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-start px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {farmacia ? "Editar Farmacia" : "Agregar Farmacia"}
                </h2>
                {farmacia && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-mono">{oficina}</span> · {nombre}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none mt-0.5"
              >
                ✕
              </button>
            </div>

            {/* TABS */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mx-5 mt-4 shrink-0">
              <button
                onClick={() => setTab("general")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${tab === "general" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                General
              </button>
              <button
                onClick={() => setTab("servidor")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${tab === "servidor" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Servidor
              </button>
            </div>

            {/* BODY */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-1/4 mt-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                </div>
              ) : (
                <>
                  {/* TAB GENERAL */}
                  {tab === "general" && (
                    <div className="space-y-4">
                      {/* Datos de matriz — solo lectura */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pb-1.5 border-b border-slate-100">
                          Datos de Matriz
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">
                              Técnico
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                              {tecnicos.find((t) => t.cedula === cedulaTecnico)
                                ?.nombreCompleto ?? "Sin Técnico"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Tipo</p>
                            <span
                              className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${
                                tipoFarmacia === "Franquicia"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-violet-50 text-violet-700"
                              }`}
                            >
                              {tipoFarmacia || "—"}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Marca</p>
                            <p className="text-sm font-medium text-slate-700">
                              {marca || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Datos propios tabla farmacias — editables */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pb-1.5 border-b border-slate-100">
                          Datos Propios
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 font-medium block mb-1">
                              Tecnología Terminales
                            </label>
                            <select
                              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                              value={tecnologiaTerminales}
                              onChange={(e) =>
                                setTecnologiaTerminales(e.target.value)
                              }
                            >
                              <option value="">— Sin especificar —</option>
                              {listaTecnoTerminales.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium block mb-1">
                              SSOO Terminales
                            </label>
                            <select
                              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                              value={soTerminales}
                              onChange={(e) => setSoTerminales(e.target.value)}
                            >
                              <option value="">— Sin especificar —</option>
                              {listaSoTerminales.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium block mb-1">
                              # Puntos de Venta
                            </label>
                            <input
                              type="number"
                              min={0}
                              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                              value={numPuntosVenta}
                              onChange={(e) =>
                                setNumPuntoVenta(parseInt(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium block mb-1">
                              Tipo Rack
                            </label>
                            <select
                              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                              value={tipoRack}
                              onChange={(e) => setTipoRack(e.target.value)}
                            >
                              <option value="">— Sin especificar —</option>
                              {listadoTipoRack.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          {farmacia && (
                            <div>
                              <label className="text-xs text-slate-500 font-medium block mb-1">
                                Estado
                              </label>
                              <select
                                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                              >
                                <option value="A">Activo</option>
                                <option value="I">Inactivo</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB SERVIDOR */}
                  {tab === "servidor" && (
                    <div>
                      {farmacia?.codigo_servidor ? (
                        <div className="space-y-4">
                          {/* Info solo lectura */}
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pb-1.5 border-b border-slate-100">
                              Servidor Principal
                            </p>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-xs text-slate-400 mb-1">
                                  Código Activo
                                </p>
                                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                  {farmacia.codigo_servidor}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">
                                  Año de Compra
                                </p>
                                <p className="text-sm font-medium text-slate-700">
                                  {farmacia.ano_servidor ?? "—"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Especificaciones editables */}
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                              Especificaciones
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-500 font-medium block mb-1">
                                  SO Servidor
                                </label>
                                <select
                                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 bg-white"
                                  value={soServidor}
                                  onChange={(e) =>
                                    setSoServidor(e.target.value)
                                  }
                                >
                                  <option value="">--- Sin asignar ---</option>
                                  {listadoSoSrv.map((item) => (
                                    <option key={item} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 font-medium block mb-1">
                                  Virtualizador
                                </label>
                                <select
                                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 bg-white"
                                  value={virtualizer}
                                  onChange={(e) =>
                                    setVirtualizer(e.target.value)
                                  }
                                >
                                  <option value="">— Sin especificar —</option>
                                  {listadoVirtualizer.map((item) => (
                                    <option key={item} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 font-medium block mb-1">
                                  RAM (GB)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                                  value={ram}
                                  onChange={(e) =>
                                    setRam(
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    // Permitir: números, backspace, delete, tab, arrows
                                    const permitidos = [
                                      "Backspace",
                                      "Delete",
                                      "Tab",
                                      "ArrowLeft",
                                      "ArrowRight",
                                      "ArrowUp",
                                      "ArrowDown",
                                    ];
                                    if (
                                      !/^\d$/.test(e.key) &&
                                      !permitidos.includes(e.key)
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  placeholder="Ej: 16"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 font-medium block mb-1">
                                  Tipo RAM
                                </label>
                                <select
                                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 bg-white"
                                  value={tipoRamSrv}
                                  onChange={(e) =>
                                    setTipoRamSrv(e.target.value)
                                  }
                                >
                                  <option value="">— Sin especificar —</option>
                                  {listadoTipoRam.map((item) => (
                                    <option key={item} value={item}>
                                      {item}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <span className="text-2xl">🖥️</span>
                          </div>
                          <p className="text-sm font-medium text-slate-600">
                            Sin servidor asignado
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Registra o asigna un servidor como principal en la
                            pestaña Activos.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-400">
                {farmacia?.fecha_sync
                  ? `Última sync: ${new Date(farmacia.fecha_sync).toLocaleDateString("es-EC")}`
                  : "Sin sincronización registrada"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
