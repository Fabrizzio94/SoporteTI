import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const pool = await getConnection();
    const request = await pool.request();

    if (!session) return NextResponse.json({ error: "No Autorizado" }, { status: 401 });

    let result = `
      SELECT 
        f.*,
        t.apellidos + ' ' + t.nombres AS nombre_tecnico,
        srv.codigo_activo  AS codigo_servidor,
        srv.ano_compra     AS ano_servidor,
        srv.so_servidor,
        srv.tipo_ram,
        srv.ram,
        srv.virtualizer
      FROM farmacia f
      LEFT JOIN tecnicos t ON t.cedula = f.cedula_tecnico
      OUTER APPLY (
        SELECT TOP 1
          a.codigo_activo,
          a.ano_compra,
          s.so_servidor,
          s.tipo_ram,
          s.ram,
          s.virtualizer
        FROM activo a
        INNER JOIN servidor s ON s.codigo_activo = a.codigo_activo
        WHERE a.oficina = f.oficina
          AND a.nombre_activo = 'CPU'
          AND a.estado = 'A'
        ORDER BY s.es_principal DESC, a.ano_compra DESC
      ) AS srv
    `;
    if ((session?.user as any).role === "TECNICO") {
      request.input("cedula_sesion", (session?.user as any).cedula);
      result += `WHERE f.cedula_tecnico = @cedula_sesion`;
    }
    result += ` ORDER BY nombre_tecnico ASC`;
    const data = await request.query(result);
    return NextResponse.json(data.recordset);
  } catch (error) {
    console.error("Error GET farmacias:", error);
    return NextResponse.json(
      { error: "Error al obtener farmacias" },
      { status: 500 }
    );
  }
}
// POST
export async function POST(req: Request) {
  try {
    //const body = await req.json();
    const { oficina, nombre, cedulaTecnico, tipoFarmacia, marca,
      tecnologiaTerminales, soTerminales, numPuntosVenta, tipoRack } = await req.json();
    const pool = await getConnection();
    const request = await pool.request();
    await request
      .input("oficina", oficina)
      .input("nombre", nombre)
      .input("cedula_tecnico", cedulaTecnico)
      .input("tipo_farmacia", tipoFarmacia)
      .input("marca", marca)
      .input("tecnologia_terminales", tecnologiaTerminales)
      .input("ssoo_terminales", soTerminales)
      .input("num_puntos_venta", numPuntosVenta)
      .input("tipo_rack", tipoRack)
      .input("estado", "A")
      .query(`
      INSERT INTO farmacia (oficina, nombre, cedula_tecnico, tipo_farmacia, marca, tecnologia_terminales,
      ssoo_terminales, num_puntos_venta, tipo_rack, estado)
      VALUES (@oficina, @nombre,@cedula_tecnico,@tipo_farmacia,@marca,@tecnologia_terminales,
      @ssoo_terminales, @num_puntos_venta,@tipo_rack,'A')
      `);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al insertar registro" },
      { status: 500 }
    );
  }

}
// put

export async function PUT(req: Request) {
  try {
    const { oficina, nombre, cedulaTecnico, tipoFarmacia, marca,
      tecnologiaTerminales, soTerminales, numPuntosVenta, tipoRack, estado } = await req.json();
    const pool = await getConnection();
    const request = await pool.request();
    await request
      .input("oficina", oficina)
      .input("nombre", nombre)
      .input("cedula_tecnico", cedulaTecnico)
      .input("tipo_farmacia", tipoFarmacia)
      .input("marca", marca)
      .input("tecnologia_terminales", tecnologiaTerminales)
      .input("ssoo_terminales", soTerminales)
      .input("num_puntos_venta", numPuntosVenta)
      .input("tipo_rack", tipoRack)
      .input("estado", estado)
      .query(`
      UPDATE farmacia
      SET
        oficina = @oficina,
        nombre = @nombre,
        cedula_tecnico = @cedula_tecnico,
        tipo_farmacia = @tipo_farmacia,
        marca = @marca,
        tecnologia_terminales = @tecnologia_terminales,
        ssoo_terminales = @ssoo_terminales,
        num_puntos_venta = @num_puntos_venta,
        tipo_rack = @tipo_rack,
        estado = @estado
      WHERE oficina = @oficina
      `);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar registro" },
      { status: 500 }
    );
  }
}
