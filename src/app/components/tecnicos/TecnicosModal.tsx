"use client";

import { Tecnico } from "@/app/types/tecnico";
import { useEffect, useState } from "react";
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
      // setCelular(tecnico.celular); // Asegúrate que tu tipo Tecnico tenga celular
      setEstado(tecnico.estado);
      //setOpen(true); // Abrir si recibimos un técnico para editar
    }
  }, [tecnico]);

  const handleSubmit = async () => {
    try {
      const bodyData = { cedula, nombres, apellidos, celular, estado, usuario };
      if(tecnico) {
        if (!nombres || !apellidos || !cedula) {
          //toast.error("Campos obligatorios incompletos");
          return;
        }

        await fetch(`/api/tecnicos/${tecnico.cedula}`, {
          method: "PUT", // update
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(bodyData),
        });
      }else{
        await fetch("/api/tecnicos", {
          method:"POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(bodyData),
        });
      }
      //toast.success("Guardado correctamente");
      //setOpen(false);
      onSaved();
  }catch(error){
    console.error("Error de red:", error);
  }
    
  };
  //if(!open) return null;
  return (
    <>
      

      {open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-black font-semibold">{tecnico ? "Editar Técnico" : "Agregar Técnico"}</h2>
              <button className="text-black">
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
                <input 
                    className="text-black border rounded p-2"
                    placeholder="estado" 
                    value={estado}
                    onChange={(e)=> setCelular(e.target.value)}
                />
              )}

              
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border rounded-md text-black"
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
