export interface Farmacia {
  oficina: string;
  nombre: string;
  tipo_farmacia: string;
  marca: string;
  estado: string;
  //ano_apertura: string;
  tecnologia_terminales: string;
  ssoo_terminales: string;
  num_puntos_venta: number;
  tipo_rack: string;
  cedula_tecnico: string;
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
