import { TipoBaja } from "@/app/types/actividad";
import type { ActualizarActivoExistenteParams } from "@/app/types/activo";
import { obtenerBajaManualPendiente, obtenerUltimoHistorico } from "@/lib/helpers/excelHelpers";

export const actualizarActivoExistente = async ({
    pool,
    codigoActivo,
    nombreActivo,
    anoCompra,
    detalle,
    farmacia,
    activoEnBD,
    nombreCustodio,
    resumen,
}: ActualizarActivoExistenteParams) => {
    // Estaba inactivo y vuelve a aparecer en Excel
    const historico = await obtenerUltimoHistorico(
        pool,
        codigoActivo
    );
    const bajaManualPendiente = await obtenerBajaManualPendiente(pool, codigoActivo);
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .input("nombre_activo", nombreActivo)
        .input("ano_compra", anoCompra)
        .input("descripcion", detalle)
        .input("oficina", farmacia.oficina)
        .input("cedula_tecnico", farmacia.cedula_tecnico ?? null)
        .input("nombre_custodio", nombreCustodio)
        .input("centro_costo", farmacia.centro_costo)
        .query(`
          UPDATE activo 
          SET
            nombre_activo = @nombre_activo,
            descripcion   = @descripcion,
            oficina       = @oficina,
            cedula_tecnico= @cedula_tecnico,
            nombre_custodio=@nombre_custodio,
            centro_costo  = @centro_costo,
            estado        = 'A'
          WHERE codigo_activo = @codigo_activo
        `);
    if (activoEnBD.control_importacion === 0) {
        await pool.request()
            .input("codigo_activo", codigoActivo)
            .query(`
                UPDATE activo
                SET control_importacion = 1
                WHERE codigo_activo = @codigo_activo
                `);
    }
    if (activoEnBD.estado === "A") {
        resumen.actualizados++;
        return;
    }
    if (bajaManualPendiente) {
        resumen.actualizados++;
        return;
    }
    if (!historico) {
        resumen.actualizados++;
        return;
    }
    if (historico.tipo_baja !== TipoBaja.AUTOMATICO) {
        resumen.actualizados++;
        return;
    }
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .input("nombre_activo", nombreActivo)
        .input("oficina", farmacia.oficina)
        .input("cedula_tecnico", activoEnBD.cedula_tecnico ?? null)
        .input("nombre_tecnico", activoEnBD.nombre_tecnico ?? "Automático")
        .input("ano_compra", anoCompra ?? null)
        .input("tipo_baja", TipoBaja.REACTIVADO_EXCEL)
        .input("verificado", 1)
        .input("fecha_verificacion", new Date())
        .query(`
                INSERT INTO historico_activo (
                codigo_activo, nombre_activo, oficina, cedula_tecnico,
                nombre_tecnico, ano_compra, motivo_baja,
                tipo_baja, verificado, fecha_verificacion
                ) VALUES (
                @codigo_activo, @nombre_activo, @oficina, @cedula_tecnico,
                @nombre_tecnico, @ano_compra,
                'Reactivado — vuelve a aparecer en carga Excel',
                @tipo_baja, @verificado, @fecha_verificacion
                )
            `);
    resumen.reactivados++;
    resumen.actualizados++;
}
