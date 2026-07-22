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
  fecha_baja: string;
  tipo_baja: TipoBaja;
  verificado: boolean;
  fecha_verificacion?: string;
};

export const TipoBaja = {
  MANUAL: "MANUAL",
  AUTOMATICO: "AUTOMATICO",
  REACTIVADO_MANUAL: "REACTIVADO_MANUAL",
  REACTIVADO_EXCEL: "REACTIVADO_EXCEL",
} as const;

export type TipoBaja = (typeof TipoBaja)[keyof typeof TipoBaja];