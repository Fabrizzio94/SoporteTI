"use client";

import { Tecnico } from "@/app/types/tecnico";
import { useState } from "react";

/* type PropsTecnicosListar = {
  tecnicos: Tecnico[];
} */

export default function TecnicosTable({tecnicos}: {tecnicos: Tecnico[]}) { // {tecnicos}: {PropsTecnicosListar}
  return (
    <div className="border rounded">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-black text-left">Cedúla</th>
            <th className="p-2 text-black text-left">Técnico</th>
            <th className="p-2 text-black text-left">Usuario</th>
            <th className="p-2 text-black text-left">Celular</th>
            <th className="p-2 text-black text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {tecnicos.map((t) => (
            <tr key={t.cedula} className="border-t">
              <td className="p-2">{t.cedula}</td>
              <td className="p-2 truncate max-w-[100px] font-medium">{t.nombre}</td>
              <td className="p-2 text-gray-500">{t.usuario}</td>
              <td className="p-2">{t.celular}</td>
              <td className="p-2">
                <span className="text-green-600 font-medium">Activo</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
