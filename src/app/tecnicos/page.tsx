"use client";

import TecnicosTable from "@/app/components/tecnicos/TecnicosTable";
import TecnicoModal from "@/app/components/tecnicos/TecnicosModal";
import TecnicoSearch from "@/app/components/tecnicos/TecnicoSearch";
import { Tecnico } from "@/app/types/tecnico";
import { useState, useEffect } from "react";

export default function TecnicosPage() {
  const [search, setSearch] = useState("");
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);
  const [open, setOpen] = useState(false);

  const handleAgregar = () => {
    setTecnicoSeleccionado(null);
    setOpen(true);
  }

  /* const handleEditar = (tecnicos) => {    
    setTecnicoSeleccionado(tecnicos);
    setOpen(true);
  } */
  const handleClose = () => {
    setOpen(false);
    setTecnicoSeleccionado(null);
  }
  useEffect(()=> {
    fetch("/api/tecnicos")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)){
        setTecnicos(data);
      }else{
        console.error("API devolvio error: ", data);
        setTecnicos([]);
      }
    });
  }, []);
  
   const filtered = tecnicos.filter(t =>
    t.nombreCompleto?.toLowerCase().includes(search.toLowerCase()) ||
    t.cedula.includes(search) ||
    t.usuario.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Técnicos</h1>
      <div className="flex justify-between mb-4">
        <div />
        <button
          onClick={handleAgregar}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md"
        >
          + Agregar
        </button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <TecnicoSearch onSearch={setSearch}/>
        <TecnicoModal
          open={open}
          tecnico ={editingTecnico}
          onClose={() => setEditingTecnico(null)}
          onSaved={() => {
              setEditingTecnico(null);
              fetch("/api/tecnicos")
              .then(res=> res.json())
              .then(data => setTecnicos(data))
          }}
        />
      </div>

      <TecnicosTable 
        tecnicos={filtered}
        onEdit={setEditingTecnico} 
      />
    </main>
  );
}
