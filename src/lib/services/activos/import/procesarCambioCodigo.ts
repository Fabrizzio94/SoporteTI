import { ProcesarCambioCodigoParams } from "@/app/types/activo";
import { extraerCodigoAnterior } from "@/lib/helpers/excelHelpers";

export const procesarCambioCodigo = async ({
    pool,
    codigoActivo,
    detalle,
    activosEnBD,
    codigosEnExcel,
}: ProcesarCambioCodigoParams): Promise<boolean> => {
    if (!codigoActivo.startsWith("18")) return false;
    const codigoAnterior = detalle ? extraerCodigoAnterior(detalle) : null;
    if (!codigoAnterior) return false;
    if (!activosEnBD.has(codigoAnterior)) return false;
    if (activosEnBD.has(codigoActivo)) return false;
    const anterior = activosEnBD.get(codigoAnterior);
    await pool.request()
        .input("codigo_nuevo", codigoActivo)
        .input("codigo_anterior", codigoAnterior)
        .query(`
            UPDATE activo
            SET codigo_activo =@codigo_nuevo
            WHERE codigo_activo=@codigo_anterior
            `);

    activosEnBD.set(codigoActivo, {
        ...anterior,
        codigo_activo: codigoActivo,
    });

    activosEnBD.delete(codigoAnterior);
    codigosEnExcel.add(codigoAnterior);

    return true;
}