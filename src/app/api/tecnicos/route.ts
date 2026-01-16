import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { pool } from "mssql";

export async function GET() {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT 
        cedula,
        nombres,
        apellidos,
        celular,
        estado,
        usuario
      FROM tecnicos
      ORDER BY nombres asc
    `);
      const data = result.recordset.map(t => ({
        ...t,
        nombreCompleto: `${t.apellidos} ${t.nombres}`,
      }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener técnicos" },
      { status: 500 }
    );
  }
}
// POST
export async function POST(req:Request) {
  try {
    const body = await req.json();
    const { cedula, nombres, apellidos, celular, estado, usuario} = await req.json();

    await pool.request()
    .input("cedula", cedula)
    .input("nombres",nombres)
    .input("apellidos",apellidos)
    .input("celular",celular)
    .input("estado","A")
    .input("usuario",usuario)
    .query(`
      INSERT INTO tecnicos (cedula, nombres, apellidos, celular, estado, usuario)
      VALUES (@cedula, @nombres,@apellidos,@celular,'A',@usuario)
      `);
    return NextResponse.json({ok:true});
} catch(error) {
    return NextResponse.json(
      { error: "Error al insertar registro" },
      { status: 500 }
    );
  }
  
}
// put
interface PutContext {
  params: Promise<{cedula: string,nombres:string,apellidos:string,celular:string,estado:string}>
}
export async function PUT(req:Request, {params}: PutContext) {
  try {
    const { cedula } = await params;
    const { nombres, apellidos, celular,estado } = await req.json();
    await pool.request()
    .input("cedula", cedula)
    .input("nombres", nombres)
    .input("apellidos", apellidos)
    .input("celular", celular)
    .input("estado", estado)
    .query(`
      UPDATE tecnicos
      SET
        nombres = @nombres,
        apellidos = @apellidos,
        celular = @celular,
        estado = @estado
      WHERE cedula = @cedula
      `);
      return NextResponse.json({ok: true});
  }catch(error){
    return NextResponse.json(
      { error: "Error al actualizar registro" },
      { status: 500 }
    );
  }
}
