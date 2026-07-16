import sql from "mssql"
import type { ConnectionPool } from "mssql"
import type { ProcesarBajasParams } from "@/app/types/activo";

import { ACTIVOS_PERMITIDOS, extraerCodigoAnterior, extraerAnoCompra } from "@/lib/helpers/excelHelpers";



export const procesarBajas = async ({
    pool,
    activosEnBD,
    codigosEnExcel,
    resumen,
}: ProcesarBajasParams) => {
    for (const [codigo, activo] of activosEnBD) {
        if (!activo.control_importacion) continue;
        if (codigosEnExcel.has(codigo)) continue;
        if (activo.tipo_farmacia === "Franquicia") continue;
        if (activo.estado !== "A") {
            const manualPendienteCheck = await pool.request()
                .input("codigo_activo", codigo)
                .query(`
          SELECT id FROM historico_activo
          WHERE codigo_activo = @codigo_activo
            AND tipo_baja     = 'MANUAL'
            AND verificado    = 0
        `);

            if (manualPendienteCheck.recordset.length > 0) {
                await pool.request()
                    .input("codigo_activo", codigo)
                    .query(`
            UPDATE historico_activo SET
              verificado         = 1,
              fecha_verificacion = GETDATE()
            WHERE codigo_activo = @codigo_activo
              AND tipo_baja     = 'MANUAL'
              AND verificado    = 0
          `);
            }
            continue;
        }

        await pool.request()
            .input("codigo_activo", codigo)
            .query(`UPDATE activo SET estado = 'I' WHERE codigo_activo = @codigo_activo`);

        const manualPendiente = await pool.request()
            .input("codigo_activo", codigo)
            .query(`
        SELECT id FROM historico_activo
        WHERE codigo_activo = @codigo_activo
          AND tipo_baja     = 'MANUAL'
          AND verificado    = 0
      `);

        if (manualPendiente.recordset.length > 0) {
            await pool.request()
                .input("codigo_activo", codigo)
                .query(`
          UPDATE historico_activo SET
            verificado         = 1,
            fecha_verificacion = GETDATE()
          WHERE codigo_activo = @codigo_activo
            AND tipo_baja     = 'MANUAL'
            AND verificado    = 0
        `);
        } else {
            await pool.request()
                .input("codigo_activo", codigo)
                .input("nombre_activo", activo.nombre_activo)
                .input("oficina", activo.oficina)
                .input("cedula_tecnico", activo.cedula_tecnico ?? null)
                .input("nombre_tecnico", activo.nombre_tecnico ?? "Automático")
                .input("ano_compra", activo.ano_compra ?? null)
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
            'No encontrado en carga Excel',
            @tipo_baja, @verificado, @fecha_verificacion
          )
        `);
            resumen.bajas_automaticas++;
        }
    }

};