"use client";

import { Farmacia } from "@/app/types/farmacia";
import { tree } from "next/dist/build/templates/app-page";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Tecnico } from "@/app/types/tecnico";
type Props = {
  open: boolean;
  farmacia?: Farmacia | null;
  onClose: () => void;
  onSaved: () => void;
};
export default function FarmaciaModal({
  farmacia,
  onClose,
  onSaved,
  open,
}: Props) {
  // variables farmacia
  const [oficina, setOficina] = useState("");
  const [nombre, setNombre] = useState("");
  const [nombreTecnico, setNombreTecnico] = useState("");
  const [tipoFarmacia, setTipoFarmacia] = useState("");
  const [marca, setMarca] = useState("");
  const [anoApertura, setAnoApertura] = useState("");
  const [tecnologiaTerminales, setTecnologiaTerminales] = useState("");
  const [soTerminales, setSoTerminales] = useState("");
  const [numPuntosVenta, setNumPuntoVenta] = useState(0);
  const [tipoRack, setTipoRack] = useState("");
  const [estado, setEstado] = useState<string>("A");
  const date = new Date();
  // variables tecnicos listar fetch
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [cedulaTecnico, setCedulaTecnico] = useState("");
  useEffect(() => {
    // fetch para traer consulta de tecnicos
    if (open) {
      fetch("/api/tecnicos")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const dataConvertida = data.map((t) => ({
              ...t,
              nombreCompleto: `${t.apellidos} ${t.nombres}`,
            }));
            setTecnicos(dataConvertida);
          }
        });
    }
  }, [open]);
  useEffect(() => {
    if (farmacia) {
      setOficina(farmacia.oficina);
      setNombre(farmacia.nombre);
      setCedulaTecnico(farmacia.cedula_tecnico || "");
      setTipoFarmacia(farmacia.tipo_farmacia);
      setMarca(farmacia.marca);
      setAnoApertura(farmacia.ano_apertura);
      setTecnologiaTerminales(farmacia.tecnologia_terminales);
      setSoTerminales(farmacia.ssoo_terminales);
      setNumPuntoVenta(farmacia.num_puntos_venta || 0);
      setTipoRack(farmacia.tipo_rack);
      setEstado(farmacia.estado);
      console.log(farmacia.cedula_tecnico); // Abrir si recibimos un técnico para editar
    } else {
      setOficina("");
      setNombre("");
      setCedulaTecnico(""); // combo box con tecnicos existentes
      setTipoFarmacia("Propia");
      setMarca("ECONOMICA");
      setAnoApertura(date.getFullYear().toString());
      setTecnologiaTerminales("INCEL-2025");
      setSoTerminales("WIN 10");
      setNumPuntoVenta(2);
      setTipoRack("3 Niveles");
      setEstado("A");
    }
  }, [farmacia, open]);

  const handleSubmit = async () => {
    if (!oficina || !nombre || !cedulaTecnico) {
      //alert("Por favor, complete los campos obligatorios");
      toast.error("Por favor, complete los campos obligatorios");
      return;
    }
    const loadingToast = toast.loading("Guardando Registro...");
    try {
      const isEditing = !!farmacia;
      const url = "/api/farmacias";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oficina,
          nombre,
          cedulaTecnico,
          tipoFarmacia,
          marca,
          anoApertura,
          tecnologiaTerminales,
          soTerminales,
          numPuntosVenta,
          tipoRack,
          estado,
        }),
      });
      if (response.ok) {
        toast.success(
          farmacia ? "Actualizado correctamente" : "Creado correctamente",
          {
            id: loadingToast,
          },
        );
        onSaved();
      } else {
        throw new Error("Error en la respuesta");
      }
    } catch (error) {
      toast.error("Hubo un error al procesar la solicitud", {
        id: loadingToast,
      });
    }
  };
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-black font-semibold">
                {farmacia ? "Editar Farmacia" : "Agregar Farmacia"}
              </h2>
              <button className="text-black" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-4">
              <input
                className="text-black border rounded p-2"
                placeholder="Oficina"
                value={oficina}
                onChange={(e) => setOficina(e.target.value)}
                disabled={!!farmacia}
              />
              <input
                className="text-black border rounded p-2"
                placeholder="Nombre Farmacia"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />

              <select
                className="text-black border rounded p-2"
                value={cedulaTecnico}
                onChange={(e) => setCedulaTecnico(e.target.value)}
              >
                <option value="">Técnico</option>
                {tecnicos.map((t) => (
                  <option key={t.cedula} value={t.cedula}>
                    {t.nombreCompleto}
                  </option>
                ))}
              </select>
              <select
                className="text-black border rounded p-2"
                value={tipoFarmacia}
                onChange={(e) => setTipoFarmacia(e.target.value)}
              >
                <option>Propia</option>
                <option>Franquicia</option>
              </select>
              <input
                className="text-black border rounded p-2"
                placeholder="Marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              />
              <input
                className="text-black border rounded p-2"
                placeholder="Año"
                value={anoApertura}
                onChange={(e) => setAnoApertura(e.target.value)}
              />
              <input
                className="text-black border rounded p-2"
                placeholder="Tecn. Terminales"
                value={tecnologiaTerminales}
                onChange={(e) => setTecnologiaTerminales(e.target.value)}
              />
              <input
                className="text-black border rounded p-2"
                placeholder="SO Terminales"
                value={soTerminales}
                onChange={(e) => setSoTerminales(e.target.value)}
              />
              <input
                className="text-black border rounded p-2"
                placeholder="# PDV"
                value={numPuntosVenta}
                onChange={(e) =>
                  setNumPuntoVenta(parseInt(e.target.value) || 0)
                }
              />
              <input
                className="text-black border rounded p-2"
                placeholder="Tipo Rack"
                value={tipoRack}
                onChange={(e) => setTipoRack(e.target.value)}
              />
              {farmacia && (
                <select
                  className="text-black border rounded p-2"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="A">Activo</option>
                  <option value="I">Inactivo</option>
                </select>
              )}
            </div>
            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border rounded-md text-black"
                onClick={onClose}
              >
                Cerrar
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                onClick={handleSubmit}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
