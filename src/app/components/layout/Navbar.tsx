"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
      
      {/* Lado izquierdo */}
      <div className="flex items-center gap-6">
        {/* Logo / Icono */}
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            ⚙️
          </div>
          <span>Soporte TI</span>
        </div>

        {/* Navegación */}
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="hover:text-indigo-300">
            Dashboard
          </Link>
          <Link href="/tecnicos" className="hover:text-indigo-300">
            Técnicos
          </Link>
          <Link href="/farmacias" className="hover:text-indigo-300">
            Farmacias
          </Link>
        </nav>
      </div>

      {/* Lado derecho */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 focus:outline-none"
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm">
            JC
          </div>
          <span className="text-sm">Jhonny Chamba</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg overflow-hidden z-50">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
              Mi perfil
            </button>
            {/* <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
              Configuración
            </button> */}
            <hr />
            <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
