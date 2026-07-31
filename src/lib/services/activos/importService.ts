import { getConnection } from "@/lib/db";
import { procesarFilaExcel } from "./import/procesarFilaExcel";
import { procesarBajas } from "./import/procesarBajas";
import { obtenerActivosBD } from "./import/obtenerActivosBD";
import type { ResumenImportacion } from "@/app/types/activo";
import { Farmacia } from "@/app/types/farmacia";
// ── Logica de negocio ─────────────────────────────────────────────────────

export const procesarImportExcel = async (
    rows: any[],
    farmacias: Farmacia[]
) => {
    const pool = await getConnection();
    const activosEnBD = await obtenerActivosBD(pool);
    const resumen: ResumenImportacion = {
        insertados: 0,
        actualizados: 0,
        franquicia_omitidos: 0,
        bajas_automaticas: 0,
        reactivados: 0,
        sin_farmacia: [],
    };

    const codigosEnExcel = new Set<string>();
    const farmaciasPorCentroCosto = new Map(
        farmacias
            .filter((f) => f.centro_costo)
            .map(f => [f.centro_costo!, f])
    );
    for (const row of rows) {
        await procesarFilaExcel({
            pool,
            row,
            farmacias,
            activosEnBD,
            codigosEnExcel,
            farmaciasPorCentroCosto,
            resumen,
        });
    }
    await procesarBajas({
        pool,
        activosEnBD,
        codigosEnExcel,
        resumen,
    });

    return resumen;
}