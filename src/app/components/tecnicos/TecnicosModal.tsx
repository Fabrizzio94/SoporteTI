"use client";

import { Tecnico } from "@/app/types/tecnico";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
type Props = {
    open: boolean;
    tecnico?: Tecnico | null;
    onClose: () => void;
    onSaved: () => void;
  }
export default function TecnicoModal({tecnico, onClose, onSaved, open}: Props) {
  //const [open, setOpen] = useState(false);
  const [cedula, setCedula] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [celular, setCelular] = useState("");
  const [usuario, setUsuario] = useState("");
  const [estado, setEstado] = useState<string>("A");
  useEffect(()=> {
    if(tecnico){
      setCedula(tecnico.cedula);
      setNombres(tecnico.nombres);
      setApellidos(tecnico.apellidos);
      setUsuario(tecnico.usuario);
      setCelular(tecnico.celular); 
      setEstado(tecnico.estado);
      //setOpen(true); // Abrir si recibimos un técnico para editar
    } else{ 
      setCedula("");
      setNombres("");
      setApellidos("");
      setUsuario("");
      setCelular("");
    }
  }, [tecnico, open]);

  const handleSubmit = async () => {
    if (!cedula || !nombres || !apellidos || !usuario) {
      //alert("Por favor, complete los campos obligatorios");
      toast.error("Por favor, complete los campos obligatorios");
      return;
    }
    const loadingToast = toast.loading("Guardando Registro...")
    try {
        const isEditing = !!tecnico;
        const url = '/api/tecnicos';
        const method = isEditing ? "PUT" : "POST";
        const response = await fetch(url, {
          method: method,
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ cedula, nombres, apellidos, celular, estado, usuario}),
        });
        if(response.ok) {
          toast.success(tecnico ? "Actualizado correctamente": "Creado correctamente", {
            id: loadingToast,
          });
          onSaved();
        } else {
          throw new Error("Error en la respuesta");
        }
    }
    catch(error) {
      toast.error("Hubo un error al procesar la solicitud",{
        id: loadingToast,
      });
    }
  }
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-black font-semibold">{tecnico ? "Editar Técnico" : "Agregar Técnico"}</h2>
              <button className="text-black" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-4">
              <input 
                    className="text-black border rounded p-2" 
                    placeholder="Cédula"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    disabled={!!tecnico} 
              />
              <input 
                    className="text-black border rounded p-2" 
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
              />
              <input 
                    className="text-black border rounded p-2" 
                    placeholder="Apellidos" 
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
              />
              <input 
                    className="text-black border rounded p-2" 
                    placeholder="Nombres"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
              />
              <input 
                    className="text-black border rounded p-2"
                    placeholder="Celular" 
                    value={celular}
                    onChange={(e)=> setCelular(e.target.value)}
              />
              {tecnico && (
                
                  <select className="text-black border rounded p-2"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}>
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
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md" onClick={handleSubmit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
