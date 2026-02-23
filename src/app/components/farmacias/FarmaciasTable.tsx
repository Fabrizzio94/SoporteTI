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
      <div className="border rounded">
        <table className="w-full table-auto text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-black text-left">Oficina</th>
              <th className="p-2 text-black text-left">Nombre</th>
              <th className="p-2 text-black text-left">Tecnico</th>
              <th className="p-2 text-black text-left">Tipo</th>
              <th className="p-2 text-black text-left">Marca</th>
              <th className="p-2 text-black text-left">Año</th>
              <th className="p-2 text-black text-left">Tecn. Terminales</th>
              <th className="p-2 text-black text-left">SO Terminales</th>
              <th className="p-2 text-black text-left"># PDV </th>
              <th className="p-2 text-black text-left">Tipo Rack</th>
              <th className="p-2 text-black text-left">Estado</th>
              <th className="p-2 text-black text-left"></th>
            </tr>
          </thead>
          <tbody>
            {farmacias.map((t) => (
              <tr key={t.oficina} className="border-t">
                <td className="p-2">{t.oficina}</td>
                <td className="p-2 w-fit">{t.nombre}</td>
                <td className="p-2 w-fit">{t.nombreTecnico}</td>
                <td className="p-2">{t.tipo_farmacia}</td>
                <td className="p-2">{t.marca}</td>
                <td className="p-2">{t.ano_apertura}</td>
                <td className="p-2">{t.tecnologia_terminales}</td>
                <td className="p-2">{t.ssoo_terminales}</td>
                <td className="p-2">{t.num_puntos_venta}</td>
                <td className="p-2">{t.tipo_rack}</td>
                <td className="p-2">
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
                      <SquarePen color="#15416f"
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
