import sql from "mssql";
import { getConnection } from "@/lib/db";
import {
    ACTIVOS_PERMITIDOS,
    extraerCodigoAnterior,
    extraerAnoCompra,
} from "@/lib/helpers/excelHelpers";

// ── Logica de negocio ─────────────────────────────────────────────────────


export const procesarImportExcel = async (
    rows: any[],
    farmacias: any[]
) => {
    const pool = await getConnection();

    const activosEnBDResult = await pool.request().query(`
    SELECT a.codigo_activo, a.estado, a.nombre_activo, a.oficina,
           a.cedula_tecnico, a.ano_compra, f.tipo_farmacia,
           t.apellidos + ' ' + t.nombres AS nombre_tecnico
    FROM activo a
    LEFT JOIN farmacia f ON f.oficina = a.oficina
    LEFT JOIN tecnicos t ON t.cedula = a.cedula_tecnico
  `);

    const activosEnBD = new Map<string, any>(
        activosEnBDResult.recordset.map((a: any) => [a.codigo_activo, a])
    );

    const resumen = {
        insertados: 0,
        actualizados: 0,
        franquicia_omitidos: 0,
        bajas_automaticas: 0,
        reactivados: 0,
        sin_farmacia: [] as string[],
    };

    const codigosEnExcel = new Set<string>();

    // ── LOOP 1 — PROCESAR FILAS DEL EXCEL ────────────────────────
    for (const row of rows) {
        const codigoActivo = row["Activo fijo"]?.toString().trim();
        const nombreActivo = row["Nombre Activo"]?.toString().trim().toUpperCase();
        const centroCosto = row["Centro Costo Origen"]?.toString().trim().toUpperCase();
        const fechaAlta = row["Fecha de Alta"];
        const detalle = row["Detalle"]?.toString().trim() ?? null;
        const nombrecustodio = row["Nombre Custodio"]?.toString().trim() ?? null;

        if (!codigoActivo || !nombreActivo || !centroCosto) continue;

        codigosEnExcel.add(codigoActivo);

        // ── DETECCIÓN CAMBIO 14→18 ──────────────────────────────
        if (codigoActivo.startsWith("18")) {
            const codigoAnterior = detalle ? extraerCodigoAnterior(detalle) : null;
            if (activosEnBD.has(codigoActivo)) {
                // ya existe — flujo normal lo actualiza
            } else if (codigoAnterior && activosEnBD.has(codigoAnterior)) {
                const anteriorData = activosEnBD.get(codigoAnterior);

                await pool.request()
                    .input("codigo_nuevo", codigoActivo)
                    .input("codigo_anterior", codigoAnterior)
                    .query(`UPDATE activo SET codigo_activo = @codigo_nuevo WHERE codigo_activo = @codigo_anterior`);

                await pool.request()
                    .input("codigo_nuevo", codigoActivo)
                    .input("codigo_anterior", codigoAnterior)
                    .query(`UPDATE servidor SET codigo_activo = @codigo_nuevo WHERE codigo_activo = @codigo_anterior`);

                activosEnBD.set(codigoActivo, { ...anteriorData, codigo_activo: codigoActivo });
                activosEnBD.delete(codigoAnterior);
                codigosEnExcel.add(codigoAnterior);
            }
        }

        if (!ACTIVOS_PERMITIDOS.has(nombreActivo)) continue;

        const anoCompra = fechaAlta instanceof Date
            ? fechaAlta.getFullYear()
            : fechaAlta ? new Date(fechaAlta).getFullYear() : null;

        const farmacia = farmacias.find((f: any) => f.nombre.toUpperCase() === centroCosto);
        const esContactCenter = centroCosto === "CONTACT CENTER OPERATIVO";

        if (!farmacia && !esContactCenter) {
            resumen.sin_farmacia.push(`${codigoActivo} - ${centroCosto}`);
            continue;
        }
        if (!farmacia && esContactCenter) {
            const tecnicoData = await pool.request()
                .input("nombre_custodio", nombrecustodio?.toUpperCase().trim() ?? "")
                .query(`
                    SELECT cedula FROM tecnicos
                    WHERE UPPER(TRIM(apellidos+' '+nombres))= @nombre_custodio`);
            const cedulaTecnico = tecnicoData.recordset[0]?.cedula ?? null;
            const esTecnico = await pool.request()
                .input("nombre_custodio", nombrecustodio?.toUpperCase().trim() ?? "")
                .query(`
                SELECT COUNT (*) AS total
                FROM tecnicos
                WHERE UPPER(TRIM(apellidos + ' '+ nombres))=@nombre_custodio `);
            if (esTecnico.recordset[0].total === 0) continue;
            const activoEnBD = activosEnBD.get(codigoActivo);
            if (activoEnBD) {
                await pool.request()
                    .input("codigo_activo", codigoActivo)
                    .input("nombre_custodio", nombrecustodio)
                    .input("cedula_tecnico", cedulaTecnico)
                    .query(`
                        UPDATE activo SET nombre_custodio = @nombre_custodio, cedula_tecnico=@cedula_tecnico
                        WHERE codigo_activo = @codigo_activo
                        `);
                resumen.actualizados++;
            } else {

                await pool.request()
                    .input("codigo_activo", codigoActivo)
                    .input("nombre_activo", nombreActivo)
                    .input("ano_compra", anoCompra)
                    .input("descripcion", detalle)
                    .input("nombre_custodio", nombrecustodio)
                    .input("cedula_tecnico", cedulaTecnico)
                    .query(`
                    INSERT INTO activo (codigo_activo, nombre_activo, ano_compra, descripcion, estado, nombre_custodio)
                    VALUES (@codigo_activo, @nombre_activo, @ano_compra, @descripcion, 'A', @nombre_custodio)`
                    );
                resumen.insertados++;
                activosEnBD.set(codigoActivo, {
                    codigo_activo: codigoActivo,
                    estado: "A",
                    nombre_activo: nombreActivo,
                    oficina: null,
                    cedula_tecnico: null,
                    ano_compra: anoCompra,
                    tipo_farmacia: null,
                    nombre_tecnico: null,
                });
            }
            continue;
        }
        //if (!farmacia) continue;
        const esFranquicia = farmacia.tipo_farmacia === "Franquicia";
        const activoEnBD = activosEnBD.get(codigoActivo);
        const yaExiste = !!activoEnBD;

        if (esFranquicia && !yaExiste) {
            resumen.franquicia_omitidos++;
            continue;
        }

        if (yaExiste) {
            await pool.request()
                .input("codigo_activo", codigoActivo)
                .input("nombre_activo", nombreActivo)
                .input("ano_compra", anoCompra)
                .input("descripcion", detalle)
                .input("oficina", farmacia.oficina)
                .input("cedula_tecnico", farmacia.cedula_tecnico ?? null)
                .input("nombre_custodio", nombrecustodio)
                .query(`
          UPDATE activo SET
            nombre_activo = @nombre_activo,
            ano_compra    = @ano_compra,
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

            resumen.actualizados++;
        } else {
            await pool.request()
                .input("codigo_activo", codigoActivo)
                .input("nombre_activo", nombreActivo)
                .input("ano_compra", anoCompra)
                .input("descripcion", detalle)
                .input("oficina", farmacia.oficina)
                .input("cedula_tecnico", farmacia.cedula_tecnico ?? null)
                .input("nombre_custodio", nombrecustodio)
                .query(`
          INSERT INTO activo (codigo_activo, nombre_activo, ano_compra, descripcion, estado, oficina, cedula_tecnico,nombre_custodio)
          VALUES (@codigo_activo, @nombre_activo, @ano_compra, @descripcion, 'A', @oficina, @cedula_tecnico, @nombre_custodio)
        `);
            resumen.insertados++;
            activosEnBD.set(codigoActivo, {
                codigo_activo: codigoActivo,
                estado: "A",
                nombre_activo: nombreActivo,
                oficina: farmacia.oficina,
                cedula_tecnico: farmacia.cedula_tecnico ?? null,
                ano_compra: anoCompra,
                tipo_farmacia: farmacia.tipo_farmacia,
                nombre_tecnico: null,
            });
        }

        // ── SERVIDOR ─────────────────────────────────────────────
        const esServidor = nombreActivo === "CPU" && detalle?.toUpperCase().includes("SERVIDOR");
        if (esServidor) {
            await pool.request()
                .input("codigo_activo", codigoActivo)
                .input("oficina", farmacia.oficina)
                .query(`
          MERGE INTO servidor AS D
          USING (SELECT @codigo_activo AS codigo_activo) AS O
            ON D.codigo_activo = O.codigo_activo
          WHEN MATCHED THEN
            UPDATE SET es_principal = CASE
              WHEN D.es_principal = 1 THEN 1
              WHEN NOT EXISTS (
                SELECT 1 FROM servidor s2
                INNER JOIN activo a2 ON a2.codigo_activo = s2.codigo_activo
                WHERE a2.oficina = @oficina
                  AND a2.nombre_activo = 'CPU'
                  AND s2.es_principal = 1
                  AND s2.codigo_activo != D.codigo_activo
              ) THEN 1 ELSE 0 END
          WHEN NOT MATCHED THEN
            INSERT (codigo_activo, virtualizer, ram, tipo_ram, so_servidor, es_principal)
            VALUES (@codigo_activo, null, null, null, null,
              CASE WHEN NOT EXISTS (
                SELECT 1 FROM servidor s2
                INNER JOIN activo a2 ON a2.codigo_activo = s2.codigo_activo
                WHERE a2.oficina = @oficina
                  AND a2.nombre_activo = 'CPU'
                  AND s2.es_principal = 1
              ) THEN 1 ELSE 0 END
            );
        `);
        }
    }

    // ── LOOP 2 — BAJAS AUTOMÁTICAS ───────────────────────────────
    for (const [codigo, activo] of activosEnBD) {
        if (codigosEnExcel.has(codigo)) continue;

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

    return resumen;
};