// /app/api/activos/baja/route.ts
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Tecnico } from "@/app/types/tecnico";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const user = session.user as Tecnico;
    console.log("user session:", user)
    const { codigo_activo, motivo_baja, observacion, codigo_reemplazo } = await req.json();

    if (!codigo_activo || !motivo_baja) {
      return NextResponse.json({ error: "Código y motivo son obligatorios" }, { status: 400 });
    }

    const pool = await getConnection();

    // Obtener datos del activo antes de dar de baja
    const activoResult = await pool.request()
      .input("codigo_activo", codigo_activo)
      .query(`
        SELECT a.*, f.tipo_farmacia
        FROM activo a
        INNER JOIN farmacia f ON f.oficina = a.oficina
        WHERE a.codigo_activo = @codigo_activo
      `);

    const activo = activoResult.recordset[0];
    if (!activo) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });

    const esFranquicia = activo.tipo_farmacia === "Franquicia";
    // obtener nombre completo de tecnico
    const tecnicoResult = await pool.request()
    .input("cedula", user.cedula) // se toma del token jwt de la sesion
    .query(`SELECT apellidos + ' ' + nombres AS nombre_completo FROM tecnicos 
        WHERE cedula = @cedula`);
    const nombreTecnico = tecnicoResult.recordset[0]?.nombre_completo ?? "Sin Tecnico";
    // Dar de baja el activo
    await pool.request()
      .input("codigo_activo", codigo_activo)
      .query(`UPDATE activo SET estado = 'I' WHERE codigo_activo = @codigo_activo`);

    // Registrar en historico
    await pool.request()
      .input("codigo_activo",      codigo_activo)
      .input("nombre_activo",      activo.nombre_activo)
      .input("oficina",            activo.oficina)
      .input("cedula_tecnico",     activo.cedula_tecnico ?? null)
      .input("motivo_baja",        motivo_baja)
      .input("observacion",        observacion ?? null)
      .input("ano_compra",         activo.ano_compra ?? null)
      .input("codigo_reemplazo",   codigo_reemplazo ?? null)
      .input("tipo_baja",          "MANUAL")
      .input("nombre_tecnico", nombreTecnico)
      // Franquicia va directo a verificado, Propia queda pendiente
      .input("verificado",         esFranquicia ? 1 : 0)
      .input("fecha_verificacion", esFranquicia ? new Date() : null)
      .query(`
        INSERT INTO historico_activo (
          codigo_activo, nombre_activo, oficina, cedula_tecnico,
          motivo_baja, observacion, ano_compra, codigo_reemplazo,
          nombre_tecnico,tipo_baja, verificado, fecha_verificacion
        ) VALUES (
          @codigo_activo, @nombre_activo, @oficina, @cedula_tecnico,
          @motivo_baja, @observacion, @ano_compra, @codigo_reemplazo,
          @nombre_tecnico, @tipo_baja, @verificado, @fecha_verificacion
        )
      `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error baja activo:", error);
    return NextResponse.json({ error: "Error al dar de baja" }, { status: 500 });
  }
}