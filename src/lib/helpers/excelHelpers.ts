import * as XLSX from "xlsx";

export const ACTIVOS_PERMITIDOS = new Set([
    "CPU",
    "CPU TERMINAL",
    "TECLADO",
    "MOUSE",
    "IMPRESORA",
    "IMPRESORA MULTIFUNCION",
    "IMPRESORA TERMICA",
    "SWITCH",
    "ACCES POINT",
    "UPS",
    "LECTOR DE HUELLA DIGITAL",
    "LECTOR DE CODIGO DE BARRAS",
    "LECTOR DE BANDA MAGNETICA",
    "TELEFONO IP",
    "MONITOR",
    "MONITOR 19 PULGADAS",
    "MONITOR 16 PULGADAS",
    "MONITOR 19.5 PULGADAS",
    "MONITOR 18.5 PULGADAS",
    "MONITOR 16.5 PULGADAS",
    "MONITOR 15.6 PULGADAS",
    "MONITOR 15 PULGADAS",
]);

export const COLUMNAS_REQUERIDAS = [
    "Nombre Activo", "Activo fijo",
    "Centro Costo Origen", "Fecha de Alta", "Detalle",
    "Nombre Custodio"
];

export const extraerCodigoAnterior = (detalle: string): string | null => {
    if (!detalle) return null;
    const match = detalle.match(/14\d{8}/);
    return match ? match[0] : null;
};

export const leerExcel = async (file: File): Promise<any[]> => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
};

export const validarColumnas = (rows: any[]): string[] => {
    const primeraFila = rows[0];
    return COLUMNAS_REQUERIDAS.filter((c) => !(c in primeraFila));
};

export const extraerAnoCompra = (fechaAlta: any): number | null => {
    if (fechaAlta instanceof Date) return fechaAlta.getFullYear();
    if (fechaAlta) return new Date(fechaAlta).getFullYear();
    return null;
};