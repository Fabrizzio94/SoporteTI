import sql from "mssql";
import { getConnection } from "@/lib/db";
import {
    ACTIVOS_PERMITIDOS,
    extraerCodigoAnterior,
    extraerAnoCompra,
} from "@/lib/helpers/excelHelpers";
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

    for (const row of rows) {
        await procesarFilaExcel({
            pool,
            row,
            farmacias,
            activosEnBD,
            codigosEnExcel,
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