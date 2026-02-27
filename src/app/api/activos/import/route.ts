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
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as Usuario).role !== "COORDINADOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Leer archivo
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // Primera hoja sin importar nombre
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (rows.length === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    const pool = await getConnection();

    // Farmacias activas con tipo
    const farmaciasResult = await pool.request().query(`
      SELECT oficina, nombre, tipo_farmacia FROM farmacia WHERE estado = 'A'
    `);
    const farmacias = farmaciasResult.recordset;

    // Activos ya existentes en BD
    const activosExistentesResult = await pool.request().query(`
      SELECT codigo_activo FROM activo
    `);
    const activosExistentes = new Set(
      activosExistentesResult.recordset.map((a: any) => a.codigo_activo)
    );

    const resumen = {
      insertados: 0,
      actualizados: 0,
      franquicia_omitidos: 0,
      sin_farmacia: [] as string[],
    };

    for (const row of rows) {
      const codigoActivo = row["Activo fijo"]?.toString().trim();
      const nombreActivo = row["Nombre Activo"]?.toString().trim().toUpperCase();
      const centroCosto = row["Centro Costo Origen"]?.toString().trim().toUpperCase();
      const fechaAlta = row["Fecha de Alta"];
      const detalle = row["Detalle"]?.toString().trim() ?? null;
      //const modelo = row["Modelo"]?.toString().trim() ?? null;
      if (!ACTIVOS_PERMITIDOS.has(nombreActivo)) continue;
      // Validar campos mínimos
      if (!codigoActivo || !nombreActivo || !centroCosto) continue;

      // Extraer año
      const anoCompra = fechaAlta instanceof Date
        ? fechaAlta.getFullYear()
        : fechaAlta
          ? new Date(fechaAlta).getFullYear()
          : null;

      // Cruzar farmacia por nombre
      const farmacia = farmacias.find(
        (f: any) => f.nombre.toUpperCase() === centroCosto
      );

      if (!farmacia) {
        resumen.sin_farmacia.push(`${codigoActivo} - ${centroCosto}`);
        continue;
      }

      const esFranquicia = farmacia.tipo_farmacia === "Franquicia";
      const yaExiste = activosExistentes.has(codigoActivo);

      // Franquicia: omitir si no existe, actualizar si ya existe
      if (esFranquicia && !yaExiste) {
        resumen.franquicia_omitidos++;
        continue;
      }

      // Detectar servidor:
      // nombre_activo = 'CPU' Y detalle contiene 'SERVIDOR'
      const esServidor =
        nombreActivo === "CPU" &&
        detalle?.toUpperCase().includes("SERVIDOR");

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
              oficina       = @oficina
            WHERE codigo_activo = @codigo_activo
          `);
        resumen.actualizados++;
      } else {
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
        activosExistentes.add(codigoActivo);
      }

      // Servidor: MERGE respetando datos manuales ya ingresados
      if (esServidor) {
        await pool.request()
          .input("codigo_activo", codigoActivo)
          .query(`
            MERGE INTO servidor AS D
            USING (SELECT @codigo_activo AS codigo_activo) AS O
              ON D.codigo_activo = O.codigo_activo
            WHEN MATCHED THEN
              -- no sobre escribe ingresos manuales
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

    return NextResponse.json({
      ok: true,
      insertados: resumen.insertados,
      actualizados: resumen.actualizados,
      franquicia_omitidos: resumen.franquicia_omitidos,
      sin_farmacia: resumen.sin_farmacia,
      message: `${resumen.insertados} insertados, ${resumen.actualizados} actualizados`,
    });

  } catch (error) {
    console.error("Error en importación:", error);
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}