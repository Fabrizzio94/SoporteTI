// ── Tipos ─────────────────────────────────────────────────────
export type ChartItem = { nombre: string; total: number };

export type DashboardData = {
    resumen: {
        totalFarmacias: number;
        totalServidores: number;
        propias: number;
        franquicias: number;
    };
    tipoFarmacia: ChartItem[];
    marcas: ChartItem[];
    tecnologia: ChartItem[];
    soTerminales: ChartItem[];
    soServidor: ChartItem[];
    ram: ChartItem[];
    virtualizador: ChartItem[];
    num_puntos_venta: ChartItem[];
    puntosVentaAgrupado: ChartItemAgrupado[];
};
export type ChartItemAgrupado = {
    nombre: string;
    propias: number;
    franquicias: number;
}
// ── Tipo Tablas───────────────────────────────────────────────── 
export type TablaItem = {
    nombre: string;
    propias: number;
    franquicias: number;
    sin_tipo: number;
    total: number;
};

export type TablasData = {
    tecnologia: TablaItem[];
    marcas: TablaItem[];
    soTerminales: TablaItem[];
    puntosVenta: TablaItem[];
    soServidor: TablaItem[];
    ram: TablaItem[];
    anoCompraServidor: TablaItem[];
};
// ── ALIAS ────────────────────────────────────────────────────
export const ALIAS: Record<string, string> = {
    "PLAN ADMINISTRACION FARMACIAS": "PAF",
    "ADMINISTRACION CENTRAL": "ADM",
}
// ── Colores ────────────────────────────────────────────────────
export const COLORS = {
    primary: "#4f46e5",
    secondary: "#0ea5e9",
    accent: "#10b981",
    warning: "#f59e0b",
    muted: "#94a3b8",
    sinDatos: "#e2e8f0",
    COLOR_PROPIAS: "#0B2D39",
    COLOR_FRANQUICIAS: "#C7A24B",
};