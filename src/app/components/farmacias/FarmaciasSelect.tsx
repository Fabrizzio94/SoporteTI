"use client";
import type { FarmaciaSelectProps } from "@/app/types/farmacia";

import { useEffect, useMemo, useRef, useState } from "react";

export default function FarmaciaSelect({
  farmacias,
  value,
  onChange,
  placeholder = "Buscar farmacia...",
  className,
}: FarmaciaSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const farmacia = farmacias.find((f) => f.oficina === value);

    if (farmacia) {
      setSearch(farmacia.nombre);
    } else {
      setSearch("");
    }
  }, [value, farmacias]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", clickOutside);

    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const filtered = useMemo(() => {
    return farmacias.filter((f) =>
      `${f.nombre} ${f.oficina}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [farmacias, search]);

  return (
    <div className="relative" ref={ref}>
      <input
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
        value={search}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const texto = e.target.value;
          setSearch(texto);
          setOpen(true);
          if (texto.trim() === "") {
            onChange("");
          }
        }}
      />

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Sin resultados
            </div>
          ) : (
            filtered.map((f) => (
              <button
                key={f.oficina}
                type="button"
                onClick={() => {
                  onChange(f.oficina);
                  setSearch(f.nombre);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50"
              >
                <div className="font-medium">{f.nombre}</div>

                <div className="text-xs text-gray-500">{f.oficina}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
