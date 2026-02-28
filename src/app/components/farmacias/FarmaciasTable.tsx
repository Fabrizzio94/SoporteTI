"use client";

import { Farmacia } from "@/app/types/farmacia";
import { SquarePen } from "lucide-react";
type PropsFarmaciasTabla = {
  farmacias: Farmacia[];
  onEdit: (farmacia: Farmacia) => void;
};

export default function FarmaciasTable({
  farmacias,
  onEdit,
}: PropsFarmaciasTabla) {
  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full table-auto text-sm border-collapse">
          <thead className="bg-gray-100 border-b-2 border-slate-200">
            <tr>
              {[
                "Oficina",
                "Nombre",
                "Tecnico",
                "Tipo",
                "Marca",
                "Codigo Activo",
                "Año de Compra",
                "SSOO Servidor",
                "Tipo RAM",
                "RAM (GB)",
                "Tecn. terminales",
                "SO terminales",
                "Virtualizador",
                "#PDV",
                "Tipo Rack",
                "Estado",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="bg-slate-50 text-black-500 text-xs uppercase tracking-wide px-4 py-3 text-left border-b border-slate-100 font-semibold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {farmacias.map((t) => (
              <tr
                key={t.oficina}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0"
              >
                <td className="p-2">{t.oficina}</td>
                <td className="p-2 w-fit">{t.nombre}</td>
                <td className="p-2 w-fit">{t.nombre_tecnico}</td>
                <td className="p-2">{t.tipo_farmacia}</td>
                <td className="p-2">{t.marca}</td>
                <td className="p-2 font-bold">{t.codigo_servidor}</td>
                <td className="p-2 text-center">{t.ano_servidor}</td>
                <td className="p-2 text-center">{t.so_servidor}</td>
                <td className="p-2 text-center">{t.tipo_ram}</td>
                <td className="p-2 text-center">{t.ram}</td>
                <td className="p-2 text-center">{t.tecnologia_terminales}</td>
                <td className="p-2 text-center">{t.ssoo_terminales}</td>
                <td className="p-2 text-center">{t.virtualizer}</td>
                <td className="p-2 text-center">{t.num_puntos_venta}</td>
                <td className="p-2 text-center">{t.tipo_rack}</td>
                <td className="p-2 text-center">
                  <span
                    className={`${
                      t.estado === "A"
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    } `}
                  >
                    {t.estado === "A" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Editar"
                    onClick={() => onEdit(t)}
                  >
                    <span className="text-blue-600 hover:underline">
                      <SquarePen
                        color="#15416f"
                        className="w-5 h5 hover:text-blue-600"
                      />
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
