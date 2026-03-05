export type Actividad = {
  id: number;
  codigo_activo: string;
  nombre_activo: string;
  oficina: string;
  nombre_farmacia?: string;
  tipo_farmacia?: string;
  cedula_tecnico?: string;
  nombre_tecnico?: string;
  motivo_baja?: string;
  observacion?: string;
  ano_compra?: number;
  codigo_reemplazo?: string;
  usuario_baja?: string;
  fecha_baja: string;
  tipo_baja: "MANUAL" | "AUTO";
  verificado: boolean;
  fecha_verificacion?: string;
};