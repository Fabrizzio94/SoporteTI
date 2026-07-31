export interface Farmacia {
  oficina: string;
  nombre: string;
  tipo_farmacia: string;
  marca: string;
  estado: string;
  tecnologia_terminales: string;
  ssoo_terminales: string;
  num_puntos_venta: number;
  tipo_rack: string;
  cedula_tecnico: string;
  fecha_sync?: string | null;
  centro_costo?: string | null;
  // relacion opcional para joins
  nombre_tecnico?: string;
  //campos del join de tabla activos
  codigo_servidor?: string | null;
  ano_servidor?: number | null;
  so_servidor?: string | null;
  tipo_ram?: string | null;
  ram?: number | null;
  virtualizer?: string | null;
}

export interface FarmaciaSelectProps {
  farmacias: FarmaciaListado[];
  value: string;
  onChange: (oficina: string) => void;
  placeholder?: string;
  className?: string;
}
export type FarmaciaListado = Pick<Farmacia, "oficina" | "nombre">;