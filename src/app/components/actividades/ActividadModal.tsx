// /components/actividades/ActividadModal.tsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Actividad, TipoBaja } from "@/app/types/actividad";

type Props = {
  open: boolean;
  actividad: Actividad | null;
  onClose: () => void;
  onSaved: () => void;
};

const MOTIVOS = [
  "Daño irreparable",
  "Reemplazo programado",
  "Robo/Pérdida",
  "Fin de vida útil",
  "Reasignado a otra farmacia",
];

export default function ActividadModal({
  open,
  actividad,
  onClose,
  onSaved,
}: Props) {
  const [motivoBaja, setMotivoBaja] = useState("");
  const [observacion, setObservacion] = useState("");
  const [codigoReemplazo, setCodigoReemplazo] = useState("");
  const [nuevaOficina, setNuevaOficina] = useState("");
  const [confirmarReactivar, setConfirmarReactivar] = useState(false);
  // estado para listar historico activo
  const [historico, setHistorico] = useState<Actividad[]>([]);

  useEffect(() => {
    if (actividad) {
      setMotivoBaja(actividad.motivo_baja ?? "");
      setObservacion(actividad.observacion ?? "");
      setCodigoReemplazo(actividad.codigo_reemplazo ?? "");
      setNuevaOficina("");
      setConfirmarReactivar(false);
    }
  }, [actividad, open]);
  useEffect(() => {
    if (!actividad) return;
    const cargarHistorico = async () => {
      const res = await fetch(
        `/api/actividades/historico/${actividad.codigo_activo}`,
      );
      if (!res.ok) return;
      setHistorico(await res.json());
    };
    cargarHistorico();
    console.log(historico);
  }, [actividad]);
  const handleGuardar = async () => {
    const loadingToast = toast.loading("Guardando cambios...");
    try {
      const res = await fetch("/api/actividades", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actividad?.id,
          motivo_baja: motivoBaja,
          observacion: observacion || null,
          codigo_reemplazo: codigoReemplazo || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }
      toast.success("Cambios guardados", { id: loadingToast });
      onSaved();
    } catch (error: any) {
      toast.error(error.message ?? "Error inesperado", { id: loadingToast });
    }
  };

  const handleReactivar = async () => {
    const loadingToast = toast.loading("Reactivando equipo...");
    try {
      const res = await fetch("/api/actividades", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actividad?.id,
          reactivar: true,
          nueva_oficina: nuevaOficina || null,
          observacion: observacion || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al reactivar");
      }
      toast.success("Equipo reactivado correctamente", { id: loadingToast });
      onSaved();
    } catch (error: any) {
      toast.error(error.message ?? "Error inesperado", { id: loadingToast });
    }
  };

  if (!open || !actividad) return null;

  const esFranquicia = actividad.tipo_farmacia === "Franquicia";
  const esVerificado = actividad.verificado;
  // Otener titulo y colores para el historico linea de timepo
  const obtenerTitulo = (h: Actividad) => {
    switch (h.tipo_baja) {
      case TipoBaja.MANUAL:
        return h.verificado ? "Baja verificado" : "Baja registrada";
      case TipoBaja.AUTOMATICO:
        return "Baja automática";
      case TipoBaja.REACTIVADO_MANUAL:
        return "Reactivado manualmente";
      case TipoBaja.REACTIVADO_EXCEL:
        return "Reactivado por Excel";
      default:
        return "Evento";
    }
  };
  const obtenerColor = (h: Actividad) => {
    switch (h.tipo_baja) {
      case TipoBaja.MANUAL:
        return h.verificado ? "bg-emerald-400" : "bg-yellow-400";
      case TipoBaja.AUTOMATICO:
        return "bg-blue-400";
      case TipoBaja.REACTIVADO_MANUAL:
        return "bg-purple-400";
      case TipoBaja.REACTIVADO_EXCEL:
        return "bg-pink-400";
      default:
        return "bg-slate-400";
    }
  };
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-start px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Detalle de Baja ·{" "}
              <span className="font-mono text-indigo-500">
                {actividad.nombre_activo}
                {" : "}
                {actividad.codigo_activo}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {actividad.nombre_farmacia}
              {" - "}
              {actividad.oficina}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {/* DATOS READONLY */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pb-1.5 border-b border-slate-100">
              Información
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Técnico</p>
                <p className="text-sm font-medium text-slate-700">
                  {actividad.nombre_tecnico ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Fecha Baja</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date(actividad.fecha_baja).toLocaleDateString("es-EC")}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Fecha Compra</p>
                <p className="text-sm font-medium text-slate-700">
                  {actividad.fecha_compra
                    ? new Date(actividad.fecha_compra).toLocaleDateString(
                        "es-EC",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Estado</p>
                <span
                  className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    esFranquicia
                      ? "bg-slate-100 text-slate-500"
                      : esVerificado
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {esFranquicia
                    ? "🏪 Franquicia"
                    : esVerificado
                      ? "✓ Verificado"
                      : "⏳ Pendiente"}
                </span>
              </div>
              {actividad.fecha_verificacion && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">
                    Fecha Verificación
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(actividad.fecha_verificacion).toLocaleDateString(
                      "es-EC",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CAMPOS EDITABLES */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pb-1.5 border-b border-slate-100">
              Editar Registro
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Motivo de Baja
                </label>
                <select
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                >
                  <option value="">— Seleccionar —</option>
                  {MOTIVOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Observación
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 resize-none"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Detalle adicional..."
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Código Reemplazo{" "}
                  <span className="text-slate-300">(opcional)</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  value={codigoReemplazo}
                  onChange={(e) => setCodigoReemplazo(e.target.value)}
                  placeholder="Ej: 1400099001"
                />
              </div>
            </div>
          </div>

          {/* KARDEX */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 pb-1.5 border-b border-slate-100">
              Historial del equipo
            </p>

            <div className="space-y-0">
              {historico.map((h) => (
                <div
                  key={h.id}
                  className="flex gap-2 items-start py-2 border-b border-slate-50"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${obtenerColor(h)}`}
                  />

                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {obtenerTitulo(h)}
                    </p>

                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(h.fecha_baja).toLocaleDateString("es-EC")}
                      {" · "}
                      {h.motivo_baja}
                    </p>

                    {h.observacion && (
                      <p className="text-[10px] text-slate-500 italic mt-1">
                        {h.observacion}
                      </p>
                    )}

                    {h.fecha_verificacion && (
                      <p className="text-[10px] text-emerald-600 mt-1">
                        Verificado{" "}
                        {new Date(h.fecha_verificacion).toLocaleDateString(
                          "es-EC",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REACTIVAR */}
          {!confirmarReactivar ? (
            <button
              onClick={() => setConfirmarReactivar(true)}
              className="w-full text-xs text-emerald-600 border border-emerald-200 rounded-md py-2 hover:bg-emerald-50 transition font-medium"
            >
              ↩ Reactivar equipo
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-emerald-700">
                ¿Confirmar reactivación?
              </p>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Nueva farmacia{" "}
                  <span className="text-slate-300">
                    (opcional — si se reasigna)
                  </span>
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
                  value={nuevaOficina}
                  onChange={(e) => setNuevaOficina(e.target.value)}
                  placeholder="Código oficina Ej: 027"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmarReactivar(false)}
                  className="flex-1 text-xs border border-slate-200 rounded-md py-1.5 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReactivar}
                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-1.5 font-medium transition"
                >
                  Confirmar reactivación
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleGuardar}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
