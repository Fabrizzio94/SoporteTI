"use client";
import { useEffect, useState } from "react";
import { MiActivo } from "@/app/types/activo";
import toast from "react-hot-toast";
import { useDebounce } from "@/app/hooks/useDebounce";
import FarmaciaSelect from "../farmacias/FarmaciasSelect";
import { FarmaciaListado } from "@/app/types/farmacia";
interface Props {
  open: boolean;
  activo?: MiActivo | null;
  farmacias: FarmaciaListado[];
  onClose: () => void;
  onSaved: () => void;
}

export default function MisActivoModal({
  open,
  activo,
  farmacias,
  onClose,
  onSaved,
}: Props) {
  const [oficina, setOficina] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activo) {
      setOficina(activo.oficina ?? "");
    }
  }, [activo]);
  if (!open || !activo) return null;

  const guardar = async () => {
    try {
      await fetch("/api/activos/misactivos/asignar", {
        method: "PUT",
        body: JSON.stringify({
          codigo_activo: activo.codigo_activo,
          oficina,
        }),
      });

      onSaved();
      onClose();
    } catch {
      toast.error("No se pudo asignar la farmacia.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">
          Asignar activo a Punto de Venta
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Código
            </label>
            <input
              value={activo.codigo_activo}
              disabled
              className="w-full rounded-lg border bg-slate-100 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Activo
            </label>
            <input
              value={activo.nombre_activo}
              disabled
              className="w-full rounded-lg border bg-slate-100 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Farmacia
            </label>

            <FarmaciaSelect
              value={oficina}
              onChange={setOficina}
              farmacias={farmacias}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            onClick={guardar}
            disabled={saving || !oficina}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
