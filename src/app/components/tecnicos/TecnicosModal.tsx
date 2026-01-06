"use client";

import { useState } from "react";

export default function TecnicoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md"
      >
        + Agregar
      </button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-black font-semibold">Agregar Técnico</h2>
              <button onClick={() => setOpen(false)} className="text-black">
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-4">
              <input className="text-black border rounded p-2" placeholder="Oficina" />
              <input className="text-black border rounded p-2" placeholder="Nombre completo" />
              <input className="text-black border rounded p-2" placeholder="Usuario" />
              <input className="text-black border rounded p-2" placeholder="Celular" />
              <input className="text-black border rounded p-2" placeholder="Ciudad" />
              <input className="text-black border rounded p-2" placeholder="Provincia" />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded-md text-black"
              >
                Cerrar
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
