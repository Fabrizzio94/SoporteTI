import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
//import { pool } from "mssql";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
//import { request } from "http";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const pool = await getConnection();
    const request = await pool.request();
    
    if (!session) return NextResponse.json({ error: "No Autorizado" }, { status: 401 });
    
    let result = `
      SELECT 
        f.oficina,
        f.nombre,
        f.cedula_tecnico,
        (t.apellidos + ' ' + t.nombres) AS nombreTecnico,
        f.tipo_farmacia,
        f.marca,
        f.ano_apertura,
        f.tecnologia_terminales,
        f.ssoo_terminales,
        f.num_puntos_venta,
        f.tipo_rack,
        f.estado
      FROM farmacia f
      LEFT JOIN tecnicos t ON f.cedula_tecnico = t.cedula
    `;
    if((session?.user as any).role ==="TECNICO"){
      request.input("cedula_sesion",(session?.user as any).cedula);
      result += `WHERE f.cedula_tecnico = @cedula_sesion`;
    }
    result += ` ORDER BY nombreTecnico ASC`;
    const data = await request.query(result);
    return NextResponse.json(data.recordset);
  } catch (error) {
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
      anoApertura, tecnologiaTerminales, soTerminales, numPuntosVenta, tipoRack } = await req.json();
    const pool = await getConnection();
    const request = await pool.request();
    await request
      .input("oficina", oficina)
      .input("nombre", nombre)
      .input("cedula_tecnico", cedulaTecnico)
      .input("tipo_farmacia", tipoFarmacia)
      .input("marca", marca)
      .input("ano_apertura", anoApertura)
      .input("tecnologia_terminales", tecnologiaTerminales)
      .input("ssoo_terminales", soTerminales)
      .input("num_puntos_venta", numPuntosVenta)
      .input("tipo_rack", tipoRack)
      .input("estado", "A")
      .query(`
      INSERT INTO farmacia (oficina, nombre, cedula_tecnico, tipo_farmacia, marca, ano_apertura, tecnologia_terminales,
      ssoo_terminales, num_puntos_venta, tipo_rack, estado)
      VALUES (@oficina, @nombre,@cedula_tecnico,@tipo_farmacia,@marca,@ano_apertura,@tecnologia_terminales,
      @ssoo_terminales, @num_puntos_venta,@tipo_rack,'A')
      `);
    return NextResponse.json({ ok: true });
  } catch (error) {
    //console.log(error);
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
      anoApertura, tecnologiaTerminales, soTerminales, numPuntosVenta, tipoRack, estado } = await req.json();
    const pool = await getConnection();
    const request = await pool.request();
    await request
      .input("oficina", oficina)
      .input("nombre", nombre)
      .input("cedula_tecnico", cedulaTecnico)
      .input("tipo_farmacia", tipoFarmacia)
      .input("marca", marca)
      .input("ano_apertura", anoApertura)
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
        ano_apertura = @ano_apertura,
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
