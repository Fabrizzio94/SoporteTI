import type { ConnectionPool } from "mssql";
import { Farmacia } from "./farmacia";
export type Activo = {
    codigo_activo: string;
    nombre_activo: string;
    ano_compra: number | null;
    descripcion: string | null;
    estado: string;
    oficina: string;
    nombre_farmacia?: string;
    cedula_tecnico?: string | null;
    nombre_tecnico?: string | null;
    marca_farmacia?: string | null;
    // Datos servidor (solo si nombre_activo = 'CPU')
    virtualizer?: string | null;
    ram?: number | null;
    tipo_ram?: string | null;
    so_servidor?: string | null;
    es_principal?: boolean | null;
    nombre_custodio?: string | null;
};

// importador de excel interfaces
export interface ResumenImportacion {
    insertados: number;
    actualizados: number;
    franquicia_omitidos: number;
    bajas_automaticas: number;
    reactivados: number;
    sin_farmacia: string[];
}
export interface ProcesarFilaParams {
    pool: ConnectionPool;
    row: any;
    farmacias: Farmacia[];
    activosEnBD: Map<string, any>;
    codigosEnExcel: Set<string>;
    resumen: ResumenImportacion;
}

export interface ProcesarServidorParams {
    pool: ConnectionPool;
    codigo_activo: string;
    nombre_activo: string;
    descripcion?: string | null;
    oficina: string;
}
export interface ProcesarBajasParams {
    pool: ConnectionPool;
    activosEnBD: Map<string, any>;
    codigosEnExcel: Set<string>;
    resumen: ResumenImportacion;
}
export interface ProcesarCambioCodigoParams {
    pool: ConnectionPool;
    codigoActivo: string;
    detalle: string | null;
    activosEnBD: Map<string, any>;
    codigosEnExcel: Set<string>;
}

export interface ProcesarCCParams {
    pool: ConnectionPool;
    codigoActivo: string;
    nombreActivo: string;
    anoCompra: number | null;
    detalle: string | null;
    nombreCustodio: string | null;
    activosEnBD: Map<string, any>;
    resumen: ResumenImportacion;
}
export interface ActualizarActivoExistenteParams {
    pool: ConnectionPool;
    codigoActivo: string;
    nombreActivo: string;
    anoCompra: number | null;
    detalle: string | null;
    farmacia: Farmacia;
    activoEnBD: any;
    nombreCustodio: string | null;
    resumen: ResumenImportacion;
}
export interface InsertarActivoNuevoParams {
    pool: ConnectionPool;
    codigoActivo: string;
    nombreActivo: string;
    anoCompra: number | null;
    detalle: string | null;
    farmacia: Farmacia;
    activosEnBD: any;
    nombreCustodio: string | null;
    resumen: ResumenImportacion;
}