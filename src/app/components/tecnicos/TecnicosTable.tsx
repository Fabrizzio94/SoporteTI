"use client";

import { Tecnico } from "@/app/types/tecnico";
import { useState } from "react";

type PropsTecnicosTabla = {
  tecnicos: Tecnico[];
  onEdit: (tecnico: Tecnico) => void;
}

export default function TecnicosTable({tecnicos, onEdit}: PropsTecnicosTabla) { // {tecnicos}: {PropsTecnicosListar}
  return (
    <div className="border rounded">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="pl-20 text-black text-left">Cedúla</th>
            <th className="p-2 text-black text-left">Técnico</th>
            <th className="p-2 text-black text-left">Usuario</th>
            <th className="p-2 text-black text-left">Celular</th>
            <th className="p-2 text-black text-left">Estado</th>            
            <th className="p-2 text-black text-left"></th>
          </tr>
        </thead>
        <tbody>
          {tecnicos.map((t) => (
            <tr key={t.cedula} className="border-t">
              <td className="pl-20">{t.cedula}</td>
              <td className="p-2 truncate max-w-[100px] font-medium">{t.nombreCompleto}</td>
              <td className="p-2 text-gray-500">{t.usuario}</td>
              <td className="p-2">{t.celular}</td>
              <td className="p-2">
                <span className={`${t.estado === 'A' 
                  ? 'text-green-600 font-medium'
                  :'text-red-600 font-medium'} `}>
                    {t.estado === 'A'?'Activo':'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-2">
                <button className="p-2 hover:bg-gray-100 rounded" title="Editar" onClick={() => onEdit(t)}>
                {/*<button 
                  className="text-blue-600 hover:underline">
                   onClick={() => onEdit(tecnico)}> 
                  Editar
                </button>*/}
                  <span className="text-blue-600 hover:underline">
                    <img src="/editicon.svg" alt="Editar" className="w-5 h5 hover:text-blue-600"/>
                  </span>
                  </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
