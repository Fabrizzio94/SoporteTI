import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import * as XLSX from "xlsx";
const ACTIVOS_PERMITIDOS = new Set([
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
const extraerCodigoAnterior = (detalle: string): string | null => {
  if (!detalle) return null;
  const match = detalle.match(/14\d{8}/);
  return match ? match[0] : null;
};
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as Usuario).role !== "COORDINADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json({ error: "Solo se aceptan archivos Excel (.xlsx, .xls)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (rows.length === 0) return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });

    const columnasRequeridas = ["Nombre Activo", "Activo fijo", "Centro Costo Origen", "Fecha de Alta", "Detalle"];
    const faltantes = columnasRequeridas.filter((c) => !(c in rows[0]));
    if (faltantes.length > 0) {
      return NextResponse.json(
        { error: `Archivo incorrecto. Columnas faltantes: ${faltantes.join(", ")}` },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // ── DATOS INICIALES ──────────────────────────────────────────
    const farmaciasResult = await pool.request().query(`
      SELECT oficina, nombre, tipo_farmacia FROM farmacia WHERE estado = 'A'
    `);
    const farmacias = farmaciasResult.recordset;

    const activosEnBDResult = await pool.request().query(`
      SELECT a.codigo_activo, a.estado, a.nombre_activo, a.oficina,
             a.cedula_tecnico, a.ano_compra, f.tipo_farmacia,
             t.apellidos + ' ' + t.nombres AS nombre_tecnico
      FROM activo a
      INNER JOIN farmacia f ON f.oficina = a.oficina
      LEFT JOIN tecnicos t ON t.cedula = a.cedula_tecnico
    `);
    // activosEnBD es map de la consulta, en plural
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

    // Set de todos los códigos que vienen en el Excel
    const codigosEnExcel = new Set<string>();

    // ── LOOP 1 — PROCESAR FILAS DEL EXCEL ────────────────────────
    for (const row of rows) {
      const codigoActivo = row["Activo fijo"]?.toString().trim();
      const nombreActivo = row["Nombre Activo"]?.toString().trim().toUpperCase();
      const centroCosto = row["Centro Costo Origen"]?.toString().trim().toUpperCase();
      const fechaAlta = row["Fecha de Alta"];
      const detalle = row["Detalle"]?.toString().trim() ?? null;

      if (!codigoActivo || !nombreActivo || !centroCosto) continue;

      // Registrar en Set — todos los códigos del Excel
      codigosEnExcel.add(codigoActivo);


      // ── DETECCIÓN CAMBIO 14→18 ──────────────────────────────
      // Si es 18000 y en detalle viene un 14000 → actualizar codigo en activo
      if (codigoActivo.startsWith("18")) {
        const codigoAnterior = detalle ? extraerCodigoAnterior(detalle) : null;
        if (activosEnBD.has(codigoActivo)) {
        } else if (codigoAnterior && activosEnBD.has(codigoAnterior)) {
          const anteriorData = activosEnBD.get(codigoAnterior);

          // Actualizar codigo_activo en activo — misma fila, nuevo código
          await pool.request()
            .input("codigo_nuevo", codigoActivo)
            .input("codigo_anterior", codigoAnterior)
            .query(`
              UPDATE activo SET
                codigo_activo = @codigo_nuevo
              WHERE codigo_activo = @codigo_anterior
            `);

          // Actualizar también en servidor si existe
          await pool.request()
            .input("codigo_nuevo", codigoActivo)
            .input("codigo_anterior", codigoAnterior)
            .query(`
              UPDATE servidor SET
                codigo_activo = @codigo_nuevo
              WHERE codigo_activo = @codigo_anterior
            `);

          // Actualizar Map en memoria — remover 14000, agregar 18000
          activosEnBD.set(codigoActivo, { ...anteriorData, codigo_activo: codigoActivo });
          activosEnBD.delete(codigoAnterior);

          // El 18000 ya está procesado — agregar a codigosEnExcel el anterior
          // para que Loop 2 no lo dé de baja
          codigosEnExcel.add(codigoAnterior);
          //continue;  no procesar más este row
        }
      }

      if (!ACTIVOS_PERMITIDOS.has(nombreActivo)) continue;

      const anoCompra = fechaAlta instanceof Date
        ? fechaAlta.getFullYear()
        : fechaAlta ? new Date(fechaAlta).getFullYear() : null;

      const farmacia = farmacias.find(
        (f: any) => f.nombre.toUpperCase() === centroCosto
      );

      if (!farmacia) {
        resumen.sin_farmacia.push(`${codigoActivo} - ${centroCosto}`);
        continue;
      }

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
          .query(`
            UPDATE activo SET
              nombre_activo = @nombre_activo,
              ano_compra    = @ano_compra,
              descripcion   = @descripcion,
              oficina       = @oficina,
              estado        = 'A'
            WHERE codigo_activo = @codigo_activo
          `);

        // ── REACTIVACIÓN ──────────────────────────────────────
        // Estaba inactivo y vuelve a aparecer en Excel
        if (activoEnBD.estado === 'I') {
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
        // Insertar nuevo activo
        await pool.request()
          .input("codigo_activo", codigoActivo)
          .input("nombre_activo", nombreActivo)
          .input("ano_compra", anoCompra)
          .input("descripcion", detalle)
          .input("oficina", farmacia.oficina)
          .query(`
            INSERT INTO activo (codigo_activo, nombre_activo, ano_compra, descripcion, estado, oficina)
            VALUES (@codigo_activo, @nombre_activo, @ano_compra, @descripcion, 'A', @oficina)
          `);
        resumen.insertados++;
        activosEnBD.set(codigoActivo, {
          codigo_activo: codigoActivo,
          estado: 'A',
          nombre_activo: nombreActivo,
          oficina: farmacia.oficina,
          cedula_tecnico: null,
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
      // Si aparece en Excel — ignorar
      if (codigosEnExcel.has(codigo)) continue;

      // Solo activos activos o inactivos con baja manual pendiente
      if (activo.estado !== 'A') {
        // Verificar si tiene baja manual pendiente aunque ya esté inactivo
        const manualPendienteCheck = await pool.request()
          .input("codigo_activo", codigo)
          .query(`
            SELECT id FROM historico_activo
            WHERE codigo_activo = @codigo_activo
              AND tipo_baja     = 'MANUAL'
              AND verificado    = 0
          `);

        if (manualPendienteCheck.recordset.length > 0) {
          // Marcar manual como verificado
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

      // Activo estaba activo y no aparece en Excel — dar de baja
      await pool.request()
        .input("codigo_activo", codigo)
        .query(`UPDATE activo SET estado = 'I' WHERE codigo_activo = @codigo_activo`);

      // Verificar si tiene baja manual pendiente
      const manualPendiente = await pool.request()
        .input("codigo_activo", codigo)
        .query(`
          SELECT id FROM historico_activo
          WHERE codigo_activo = @codigo_activo
            AND tipo_baja     = 'MANUAL'
            AND verificado    = 0
        `);

      if (manualPendiente.recordset.length > 0) {
        // Tenía baja manual — marcar como verificado
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
        // Sin baja manual — registrar baja automática
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

    return NextResponse.json({
      ok: true,
      insertados: resumen.insertados,
      actualizados: resumen.actualizados,
      franquicia_omitidos: resumen.franquicia_omitidos,
      bajas_automaticas: resumen.bajas_automaticas,
      reactivados: resumen.reactivados,
      sin_farmacia: resumen.sin_farmacia,
      message: `${resumen.insertados} insertados, ${resumen.actualizados} actualizados, ${resumen.bajas_automaticas} bajas automáticas`,
    });

  } catch (error) {
    console.error("Error en importación:", error);
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}