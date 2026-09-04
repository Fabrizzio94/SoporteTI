import { TipoBaja } from "@/app/types/actividad";
import type { ActualizarActivoExistenteParams } from "@/app/types/activo";
import { obtenerBajaManualPendiente, obtenerUltimoHistorico } from "@/lib/helpers/excelHelpers";

export const actualizarActivoExistente = async (params: ActualizarActivoExistenteParams) => {
    const { pool, codigoActivo, activoEnBD, resumen } = params;
    // Estaba inactivo y vuelve a aparecer en Excel
    const historico = await obtenerUltimoHistorico(
        pool,
        codigoActivo
    );
    const bajaManualPendiente = await obtenerBajaManualPendiente(pool, codigoActivo);
    const mantieneInactivo = debeMantenerseInactivo(activoEnBD, bajaManualPendiente);
    const estadoFinal: "A" | "I" = mantieneInactivo ? "I" : "A";

    await actualizarDatosActivo({ ...params, estadoFinal });
    await activarControlImportacionSiHaceFalta(pool, codigoActivo, activoEnBD.control_importacion);

    // si se mantuvo inactivo, no hay reactivacion que guardar
    if (mantieneInactivo) {
        resumen.actualizados++;
        return;
    }
    // estaba activo, no es reactivacion, solo una actualizacion normal
    if (activoEnBD.estado === "A") {
        resumen.actualizados++;
        return;
    }
    if (!historico || historico.tipo_baja !== TipoBaja.AUTOMATICO) {
        // Reactivado pero la última baja no fue automática (raro si no
        // había baja manual pendiente) — se actualiza sin registrar
        // reactivación automática, para no asumir un motivo incorrecto.
        resumen.actualizados++;
        return;
    }
    await registrarReactivaciionSiAplica(params);
    resumen.actualizados++;
}

// determinar el activo debe re activarse
const debeMantenerseInactivo = (
    activoEnBD: ActualizarActivoExistenteParams["activoEnBD"],
    bajaManualPendiente: unknown
): boolean => {
    //si esta A no hay que mantener a estado I
    if (activoEnBD.estado === "A") return false;
    // si hay baja MANUAL pendiente por verificar, el import no puede revertir
    if (bajaManualPendiente) return true;

    return false;
}

// actualiza datos del activo respetando el estado correcto
const actualizarDatosActivo = async ({
    pool,
    codigoActivo,
    nombreActivo,
    fechaCompra,
    detalle,
    farmacia,
    nombreCustodio,
    estadoFinal,
}: ActualizarActivoExistenteParams & { estadoFinal: "A" | "I" }) => {
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .input("nombre_activo", nombreActivo)
        // borrar luego de despliegie de actualizacion
        .input("fecha_compra", fechaCompra)
        .input("descripcion", detalle)
        .input("oficina", farmacia.oficina)
        .input("cedula_tecnico", farmacia.cedula_tecnico ?? null)
        .input("nombre_custodio", nombreCustodio)
        .input("centro_costo", farmacia.centro_costo)
        .input("estado", estadoFinal)
        .query(`
          UPDATE activo 
          SET
            nombre_activo   = @nombre_activo,
            descripcion     = @descripcion,
            oficina         = @oficina,
            cedula_tecnico  = @cedula_tecnico,
            nombre_custodio = @nombre_custodio,
            centro_costo    = @centro_costo,
            fecha_compra    = @fecha_compra,
            estado          = @estado
          WHERE codigo_activo = @codigo_activo
        `);
};

const activarControlImportacionSiHaceFalta = async (
    pool: any,
    codigoActivo: string,
    controlActual: number
) => {
    if (controlActual !== 0) return;
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .query(`
            UPDATE activo
            SET control_importacion = 1
            WHERE codigo_activo = @codigo_activo
            `);
}

// registra en historico la reactivacion automatica
// # solo aplica a la ultima baja fue AUTOMATICO, no hay baja manual pendiente y el
// activo si paso de estado I a A
const registrarReactivaciionSiAplica = async ({
    pool,
    codigoActivo,
    nombreActivo,
    farmacia,
    activoEnBD,
    fechaCompra,
    resumen,
}: ActualizarActivoExistenteParams) => {
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .input("nombre_activo", nombreActivo)
        .input("oficina", farmacia.oficina)
        .input("cedula_tecnico", activoEnBD.cedula_tecnico ?? null)
        .input("nombre_tecnico", activoEnBD.nombre_tecnico ?? "Automático")
        .input("fecha_compra", fechaCompra ?? null)
        .input("tipo_baja", TipoBaja.REACTIVADO_EXCEL)
        .input("verificado", 1)
        .input("fecha_verificacion", new Date())
        .query(`
            INSERT INTO historico_activo (
                codigo_activo, nombre_activo, oficina, cedula_tecnico,
                nombre_tecnico, fecha_compra, motivo_baja,
                tipo_baja, verificado, fecha_verificacion
            ) VALUES (
                @codigo_activo, @nombre_activo, @oficina, @cedula_tecnico,
                @nombre_tecnico, @fecha_compra,
                'Reactivado — vuelve a aparecer en carga Excel',
                @tipo_baja, @verificado, @fecha_verificacion
            )
        `);
    resumen.reactivados++;
}
