"use client";

import { useEffect, useMemo, useState } from "react";
import { MiActivo } from "../types/activo";
import MisActivosTable from "../components/activos/MisActivosTable";
import FarmaciaSelect from "../components/farmacias/FarmaciasSelect";
import MisActivoModal from "../components/activos/MisActivosModal";
import { FarmaciaListado } from "../types/farmacia";

export default function MisActivosPage() {
  const [activos, setActivos] = useState<MiActivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState<MiActivo | null>(
    null,
  );
  const [farmacias, setFarmacias] = useState<FarmaciaListado[]>([]);
  useEffect(() => {
    cargarMisActivos();
    cargarTodasFarmacias();
  }, []);
  const cargarTodasFarmacias = async () => {
    const res = await fetch("/api/farmacias/listar");
    const data = await res.json();
    setFarmacias(data);
  };
  const cargarMisActivos = async () => {
    setLoading(true);
    const res = await fetch("/api/activos/misactivos");
    const data = await res.json();

    setActivos(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  const filtered = useMemo(() => {
    return activos.filter(
      (a) =>
        a.codigo_activo.toLowerCase().includes(search.toLowerCase()) ||
        a.nombre_activo.toLowerCase().includes(search.toLowerCase()),
    );
  }, [activos, search]);
  const abrirEditar = (activo: MiActivo) => {
    setActivoSeleccionado(activo);
    setModalOpen(true);
  };

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mis Activos</h1>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por código (1400012345)"
          className="w-full max-w-sm border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <MisActivosTable
        activos={filtered}
        loading={loading}
        onEdit={abrirEditar}
      />
      <MisActivoModal
        open={modalOpen}
        activo={activoSeleccionado}
        farmacias={farmacias}
        onClose={() => setModalOpen(false)}
        onSaved={cargarMisActivos}
      />
      {/* Total */}
      {!loading && (
        <p className="text-xs text-slate-400 mt-3">
          {filtered.length} activo{filtered.length !== 1 ? "s" : ""} encontrado
          {filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </main>
  );
}
