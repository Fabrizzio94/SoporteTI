export type Activo = {
    codigo_activo: string;
    nombre_activo: string;
    ano_compra: number | null;
    descripcion: string | null;
    estado: string;
    oficina: string;
    nombre_farmacia?: string;
    cedula_tecnico?: string;
    nombre_tecnico?: string;
    marca_farmacia?: string | null;
    // Datos servidor (solo si nombre_activo = 'CPU')
    virtualizer?: string | null;
    ram?: number | null;
    tipo_ram?: string | null;
    so_servidor?: string | null;
    es_principal?: boolean | null;
};