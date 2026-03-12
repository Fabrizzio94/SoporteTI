/* // /app/api/actividades/route.ts

import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const user = session.user as Usuario;
    const { searchParams } = new URL(req.url);

    const busqueda = searchParams.get("busqueda") ?? "";
    const farmacia = searchParams.get("farmacia") ?? "";
    const tecnico = searchParams.get("tecnico") ?? "";
    const estado = searchParams.get("estado") ?? "";
    const desde = searchParams.get("desde") ?? "";
    const hasta = searchParams.get("hasta") ?? "";

    const pool = await getConnection();

    const filtroCedula =
      user.role === "TECNICO"
        ? `AND h.cedula_tecnico = '${user.cedula}'`
        : tecnico ? `AND h.cedula_tecnico = '${tecnico}'` : "";

    const filtroBusqueda = busqueda ? `AND h.codigo_activo LIKE '%${busqueda}%'` : "";
    const filtroFarmacia = farmacia ? `AND h.oficina = '${farmacia}'` : "";
    const filtroDesde = desde ? `AND h.fecha_baja >= '${desde}'` : "";
    const filtroHasta = hasta ? `AND h.fecha_baja <= '${hasta} 23:59:59'` : "";

    const filtroEstado =
      estado === "Verificado" ? `AND h.verificado = 1 AND h.tipo_baja = 'MANUAL'` :
        estado === "Pendiente" ? `AND h.verificado = 0 AND h.tipo_baja = 'MANUAL'` :
          estado === "Automatico" ? `AND h.tipo_baja = 'Automatico'` :
            estado === "Reactivado" ? `AND h.motivo_baja LIKE '%Reactivado%'` :
              "";

    const result = await pool.request().query(`
      SELECT
        h.*,
        f.tipo_farmacia,
        f.nombre AS nombre_farmacia
      FROM historico_activo h
      LEFT JOIN farmacia f ON f.oficina = h.oficina
      WHERE 1=1
        ${filtroCedula}
        ${filtroBusqueda}
        ${filtroFarmacia}
        ${filtroEstado}
        ${filtroDesde}
        ${filtroHasta}
      ORDER BY h.fecha_baja DESC
    `);

    // Resumen con pendientes incluido
    const resumenResult = await pool.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN tipo_baja = 'MANUAL'                        THEN 1 ELSE 0 END) AS manuales,
        SUM(CASE WHEN tipo_baja = 'Automatico'                    THEN 1 ELSE 0 END) AS automaticos,
        SUM(CASE WHEN verificado = 1                              THEN 1 ELSE 0 END) AS verificados,
        SUM(CASE WHEN tipo_baja = 'MANUAL' AND verificado = 0     THEN 1 ELSE 0 END) AS pendientes
      FROM historico_activo
      ${user.role === "TECNICO" ? `WHERE cedula_tecnico = '${user.cedula}'` : ""}
    `);

    return NextResponse.json({
      actividades: result.recordset,        // ← lista única
      resumen: resumenResult.recordset[0],
    });

  } catch (error) {
    console.error("Error actividades:", error);
    return NextResponse.json({ error: "Error al obtener actividades" }, { status: 500 });
  }
}

// PUT 
// /app/api/actividades/route.ts — agrega el PUT
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const user = session.user as Usuario;
    const {
      id,
      motivo_baja,
      observacion,
      codigo_reemplazo,
      reactivar,        // boolean — si true reactiva el activo
      nueva_oficina,    // opcional — si se reasigna a otra farmacia
    } = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const pool = await getConnection();

    // Obtener registro histórico
    const histResult = await pool.request()
      .input("id", id)
      .query(`SELECT * FROM historico_activo WHERE id = @id`);

    const hist = histResult.recordset[0];
    if (!hist) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

    if (reactivar) {
      // Reactivar activo — cambia estado a 'A' y actualiza farmacia si se reasignó
      await pool.request()
        .input("codigo_activo", hist.codigo_activo)
        .input("oficina", nueva_oficina ?? hist.oficina)
        .query(`
          UPDATE activo SET
            estado = 'A',
            oficina = @oficina
          WHERE codigo_activo = @codigo_activo
        `);

      // Insertar nuevo registro en histórico como kardex — reasignación
      await pool.request()
        .input("codigo_activo", hist.codigo_activo)
        .input("nombre_activo", hist.nombre_activo)
        .input("oficina", nueva_oficina ?? hist.oficina)
        .input("cedula_tecnico", hist.cedula_tecnico ?? null)
        .input("nombre_tecnico", hist.nombre_tecnico ?? null)
        .input("ano_compra", hist.ano_compra ?? null)
        .input("motivo_baja", nueva_oficina ? "Reasignado a otra farmacia" : "Reactivado")
        .input("observacion", observacion ?? null)
        .input("tipo_baja", "MANUAL")
        .input("verificado", 1)
        .input("fecha_verificacion", new Date())
        .query(`
          INSERT INTO historico_activo (
            codigo_activo, nombre_activo, oficina, cedula_tecnico,
            nombre_tecnico, ano_compra, motivo_baja, observacion,
            tipo_baja, verificado, fecha_verificacion
          ) VALUES (
            @codigo_activo, @nombre_activo, @oficina, @cedula_tecnico,
            @nombre_tecnico, @ano_compra, @motivo_baja, @observacion,
            @tipo_baja, @verificado, @fecha_verificacion
          )
        `);

      return NextResponse.json({ ok: true, accion: "reactivado" });
    }

    // Solo editar campos del registro existente
    await pool.request()
      .input("id", id)
      .input("motivo_baja", motivo_baja ?? hist.motivo_baja)
      .input("observacion", observacion ?? hist.observacion)
      .input("codigo_reemplazo", codigo_reemplazo ?? hist.codigo_reemplazo)
      .query(`
        UPDATE historico_activo SET
          motivo_baja      = @motivo_baja,
          observacion      = @observacion,
          codigo_reemplazo = @codigo_reemplazo
        WHERE id = @id
      `);

    return NextResponse.json({ ok: true, accion: "editado" });

  } catch (error) {
    console.error("Error PUT actividades:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
} */


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import { obtenerActividades, editarActividad, reactivarActividad } from "@/lib/services/actividades/actividadService";

export async function GET(req: Request) {
  try {
    // Verifica sesión — TECNICO ve solo las suyas, COORDINADOR ve todas
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const user = session.user as Usuario;
    const { searchParams } = new URL(req.url);

    const data = await obtenerActividades({
      rol: user.role,
      cedula: user.cedula,
      busqueda: searchParams.get("busqueda") ?? "",
      farmacia: searchParams.get("farmacia") ?? "",
      tecnico: searchParams.get("tecnico") ?? "",
      estado: searchParams.get("estado") ?? "",
      desde: searchParams.get("desde") ?? "",
      hasta: searchParams.get("hasta") ?? "",
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error("Error GET actividades:", error);
    return NextResponse.json({ error: "Error al obtener actividades" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // Verifica sesión — cualquier usuario autenticado puede editar/reactivar
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { id, motivo_baja, observacion, codigo_reemplazo, reactivar, nueva_oficina } = await req.json();

    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const resultado = reactivar
      ? await reactivarActividad({ id, observacion, nueva_oficina })
      : await editarActividad({ id, motivo_baja, observacion, codigo_reemplazo });

    if (!resultado)
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

    return NextResponse.json(resultado);

  } catch (error) {
    console.error("Error PUT actividades:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}