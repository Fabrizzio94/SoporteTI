"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Usuario } from "@/app/types/tecnico";
import {MonitorCog} from "lucide-react"
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Si no hay sesión (usuario no logueado), no mostramos el menú de usuario
  
  // Cierra el dropdown al hacer clic afuera
  useEffect(() => {
    //if (!session) return null;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [session]);
  if (!session) return null;
  return (
    <header className="sticky top-0 z-40 bg-slate-800 text-white px-6 md:px-6 py-3 md:py-3 flex justify-between items-center">
      {/* Lado izquierdo */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-blue-600 hover:underline">
                      <MonitorCog color="#000000" />
                    </span>
          </div>
          <span>Soporte TI</span>
        </div>

        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="hover:text-indigo-300">
            Dashboard
          </Link>

          {/* RESTRICCIÓN: Solo el COORDINADOR ve la pestaña Técnicos */}
          {(session.user as Usuario).role === "COORDINADOR" && (
            <Link href="/tecnicos" className="hover:text-indigo-300">
              Técnicos
            </Link>
          )}

          <Link href="/farmacias" className="hover:text-indigo-300">
            Farmacias
          </Link>
        </nav>
      </div>

      {/* Lado derecho */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 focus:outline-none group"
        >
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold uppercase">
            {/* Iniciales dinámicas */}
            {session.user?.name?.substring(0, 2)}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm">{session.user?.name}</span>
            <span className="text-[10px] text-indigo-300 uppercase">
              {(session.user as Usuario).role}
            </span>
          </div>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg border border-gray-100 overflow-hidden z-50">
            <div className="px-4 py-2 bg-gray-50 text-[11px] text-gray-500 font-bold uppercase">
              Opciones
            </div>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
              Mi perfil
            </button>
            <hr />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 text-sm font-semibold"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
