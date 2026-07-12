import type { ActualizarActivoExistenteParams } from "@/app/types/activo";

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
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .input("nombre_activo", nombreActivo)
        .input("ano_compra", anoCompra)
        .input("descripcion", detalle)
        .input("oficina", farmacia.oficina)
        .input("cedula_tecnico", farmacia.cedula_tecnico ?? null)
        .input("nombre_custodio", nombreCustodio)
        .query(`
          UPDATE activo SET
            nombre_activo = @nombre_activo,
            descripcion   = @descripcion,
            oficina       = @oficina,
            cedula_tecnico= @cedula_tecnico,
            nombre_custodio=@nombre_custodio,
            estado        = 'A'
          WHERE codigo_activo = @codigo_activo
        `); // pendiente de borrar ano_compra para que no actualice
    // cuando carga nuevo archivo y mantener año de equipos

    // Estaba inactivo y vuelve a aparecer en Excel
    if (activoEnBD.estado === "I") {
        const bajaManual = await pool.request()
            .input("codigo_activo", codigoActivo)
            .query(`
                    SELECT TOP 1 id
                    FROM historico_activo
                    WHERE codigo_activo = @codigo_activo
                        AND tipo_baja = 'MANUAL'
                        AND verificado = 0
                    `
            )
        if (bajaManual.recordset.length > 0) {
            await pool.request()
                .input("codigo_activo", codigoActivo)
                .query(`
                        UPDATE historico_activo
                        SET
                            verificado = 1,
                            fecha_verificacion = GETDATE()
                        WHERE codigo_activo = @codigo_activo
                            AND tipo_baja = 'MANUAL'
                            AND verificado = 0
                        `);
        } else {
            await pool.request()
                .input("codigo_activo", codigoActivo)
                .input("nombre_activo", nombreActivo)
                .input("oficina", farmacia.oficina)
                .input("cedula_tecnico", activoEnBD.cedula_tecnico ?? null)
                .input("nombre_tecnico", activoEnBD.nombre_tecnico ?? "Automático")
                .input("ano_compra", anoCompra ?? null)
                .input("tipo_baja", "Automatico")
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
        }
    }

    resumen.actualizados++;
}