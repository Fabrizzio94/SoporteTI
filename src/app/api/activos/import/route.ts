import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import { leerExcel, validarColumnas } from "@/lib/helpers/excelHelpers";
import { procesarImportExcel } from "@/lib/services/activos/importService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as Usuario).role !== "COORDINADOR")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls"))
      return NextResponse.json({ error: "Solo se aceptan archivos Excel (.xlsx, .xls)" }, { status: 400 });

    const rows = await leerExcel(file);
    if (rows.length === 0)
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });

    const faltantes = validarColumnas(rows);
    if (faltantes.length > 0)
      return NextResponse.json(
        { error: `Archivo incorrecto. Columnas faltantes: ${faltantes.join(", ")}` },
        { status: 400 }
      );

    const pool = await getConnection();
    const farmaciasResult = await pool.request().query(`
      SELECT oficina, nombre, tipo_farmacia, cedula_tecnico FROM farmacia WHERE estado = 'A'
    `);

    const resumen = await procesarImportExcel(rows, farmaciasResult.recordset);

    return NextResponse.json({
      ok: true,
      ...resumen,
      message: `${resumen.insertados} insertados, ${resumen.actualizados} actualizados, ${resumen.bajas_automaticas} bajas automáticas`,
    });

  } catch (error) {
    console.error("Error en importación:", error);
    return NextResponse.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}