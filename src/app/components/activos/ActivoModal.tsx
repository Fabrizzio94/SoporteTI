"use client";
import { useEffect, useState } from "react";
import { Activo } from "@/app/types/activo";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  activo?: Activo | null;
  farmacias: { oficina: string; nombre: string }[];
  onClose: () => void;
  onSaved: () => void;
};

const NOMBRES_ACTIVO = [
  "CPU",
  "CPU TERMINAL",
  "TECLADO",
  "MOUSE",
  "IMPRESORA",
  "IMPRESORA MULTIFUNCION",
  "IMPRESORA TERMICA",
  "SWITCH",
  "ACCES POINT",
  "UPS",
  "LECTOR DE HUELLA DIGITAL",
  "LECTOR DE CODIGO DE BARRAS",
  "LECTOR DE BANDA MAGNETICA",
  "TELEFONO IP",
  "MONITOR",
  "MONITOR 19 PULGADAS",
  "MONITOR 16 PULGADAS",
  "MONITOR 19.5 PULGADAS",
  "MONITOR 18.5 PULGADAS",
  "MONITOR 16.5 PULGADAS",
  "MONITOR 15.6 PULGADAS",
  "MONITOR 15 PULGADAS",
];

export default function ActivoModal({
  open,
  activo,
  farmacias,
  onClose,
  onSaved,
}: Props) {
  const [codigoActivo, setCodigoActivo] = useState("");
  const [nombreActivo, setNombreActivo] = useState("");
  const [anoCompra, setAnoCompra] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [oficina, setOficina] = useState("");
  // Servidor
  const [virtualizer, setVirtualizer] = useState("");
  const [ram, setRam] = useState("");
  const [tipoRam, setTipoRam] = useState("");
  const [soVer, setSoVer] = useState("");
  const [esPrincipal, setEsPrincipal] = useState(false);
  // Baja
  const [motivoBaja, setMotivoBaja] = useState("");
  const [observacionBaja, setObservacionBaja] = useState("");
  const [tab, setTab] = useState<"info" | "servidor" | "baja">("info");

  const isServidor = nombreActivo === "CPU";
  const isEditing = !!activo;

  useEffect(() => {
    if (activo) {
      setCodigoActivo(activo.codigo_activo ?? "");
      setNombreActivo(activo.nombre_activo ?? "");
      setAnoCompra(activo.ano_compra?.toString() ?? "");
      setDescripcion(activo.descripcion ?? "");
      setOficina(activo.oficina ?? "");
      setVirtualizer(activo.virtualizer ?? "");
      setRam(activo.ram?.toString() ?? "");
      setTipoRam(activo.tipo_ram ?? "");
      setSoVer(activo.so_servidor ?? "");
      setEsPrincipal(!!activo.es_principal);
    } else {
      setCodigoActivo("");
      setNombreActivo("");
      setAnoCompra("");
      setDescripcion("");
      setOficina("");
      setVirtualizer("");
      setRam("");
      setTipoRam("");
      setSoVer("");
    }
    setMotivoBaja("");
    setObservacionBaja("");
    setTab("info");
  }, [activo, open]);

  const handleSubmit = async () => {
    if (!codigoActivo || !nombreActivo || !oficina) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    const loading = toast.loading("Guardando...");
    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/activos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_activo: codigoActivo,
          nombre_activo: nombreActivo,
          ano_compra: anoCompra ? parseInt(anoCompra) : null,
          descripcion: descripcion || null,
          oficina,
          ...(isServidor && {
            virtualizer,
            ram: ram ? parseInt(ram) : null,
            tipo_ram: tipoRam,
            so_servidor: soVer,
          }),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEditing ? "Actualizado correctamente" : "Activo creado", {
        id: loading,
      });
      onSaved();
    } catch {
      toast.error("Error al guardar", { id: loading });
    }
  };

  const handleBaja = async () => {
    if (!motivoBaja) {
      toast.error("Selecciona un motivo de baja");
      return;
    }
    const loading = toast.loading("Procesando baja...");
    try {
      const res = await fetch("/api/activos/baja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_activo: codigoActivo,
          motivo_baja: motivoBaja,
          observacion: observacionBaja || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Activo dado de baja", { id: loading });
      onSaved();
    } catch {
      toast.error("Error al dar de baja", { id: loading });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">
            {isEditing ? `${activo?.nombre_activo} · ` : "Nuevo Activo"}
            {isEditing && (
              <span className="font-mono text-indigo-600">
                {activo?.codigo_activo}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mx-5 mt-4">
          <button
            onClick={() => setTab("info")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${tab === "info" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
          >
            Información
          </button>
          {/* Tab Servidor solo si es CPU */}
          {isServidor && (
            <button
              onClick={() => setTab("servidor")}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${tab === "servidor" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              Datos Servidor
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => setTab("baja")}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${tab === "baja" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}
            >
              Dar de Baja
            </button>
          )}
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* TAB INFO */}
          {tab === "info" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Código SAP <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 disabled:bg-slate-50"
                    value={codigoActivo}
                    onChange={(e) => setCodigoActivo(e.target.value)}
                    disabled={isEditing}
                    placeholder="1400049240"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Nombre Activo <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                    value={nombreActivo}
                    onChange={(e) => {
                      setNombreActivo(e.target.value);
                      setTab("info");
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {NOMBRES_ACTIVO.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Farmacia <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                    value={oficina}
                    onChange={(e) => setOficina(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {farmacias.map((f) => (
                      <option key={f.oficina} value={f.oficina}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Año Compra
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                    value={anoCompra}
                    onChange={(e) => setAnoCompra(e.target.value)}
                    placeholder="2024"
                    type="number"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Descripción / Detalle SAP
                </label>
                <input
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Observación o código SAP anterior"
                />
              </div>
            </>
          )}

          {/* TAB SERVIDOR */}
          {tab === "servidor" && isServidor && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Especificaciones del Servidor
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Virtualizador
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={virtualizer}
                    onChange={(e) => setVirtualizer(e.target.value)}
                    placeholder="VMware"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    RAM (GB)
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    placeholder="16"
                    type="number"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Tipo RAM
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={tipoRam}
                    onChange={(e) => setTipoRam(e.target.value)}
                    placeholder="DDR4"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    SSOO Servidor
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    value={soVer}
                    onChange={(e) => setSoVer(e.target.value)}
                    placeholder="WS-2022"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={esPrincipal}
                    onChange={(e) => setEsPrincipal(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Servidor principal de la farmacia
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB BAJA */}
          {tab === "baja" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                Dar de Baja este Activo
              </p>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                >
                  <option value="">Seleccionar motivo...</option>
                  <option>Daño irreparable</option>
                  <option>Reemplazo programado</option>
                  <option>Robo / Pérdida</option>
                  <option>Fin de vida útil</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Observación
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none"
                  rows={3}
                  value={observacionBaja}
                  onChange={(e) => setObservacionBaja(e.target.value)}
                  placeholder="Detalle del motivo..."
                />
              </div>
              <p className="text-xs text-orange-600">
                Al confirmar, el activo pasará a Inactivo y quedará en el
                historial.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
          {tab === "baja" ? (
            <button
              onClick={handleBaja}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
            >
              Confirmar Baja
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
            >
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
