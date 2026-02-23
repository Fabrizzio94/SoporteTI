import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { pool } from "mssql";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT 
        cedula,
        nombres,
        apellidos,
        estado,
        usuario,
        password,
        rol
      FROM tecnicos
      ORDER BY apellidos asc
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
export async function POST(req: Request) {
  try {
    //const body = await req.json();
    const { cedula, nombres, apellidos, password, rol, usuario } = await req.json();
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const pool = await getConnection();
    const request = await pool.request();
    await request
      .input("cedula", cedula)
      .input("nombres", nombres)
      .input("apellidos", apellidos)
      .input("password", hashedPassword)
      .input("rol", rol || 'TECNICO')
      .input("usuario", usuario)
      .input("estado", "A")
      .query(`
      INSERT INTO tecnicos (cedula, nombres, apellidos, estado,password,rol, usuario)
      VALUES (@cedula, @nombres,@apellidos,'A',@password,@rol,@usuario)
      `);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error al insertar registro" },
      { status: 500 }
    );
  }

}
// put
export async function PUT(req: Request) {
  try {
    //const { cedula } = await params;
    const { cedula, nombres, apellidos, usuario, password, rol, estado } = await req.json();
    const pool = await getConnection();
    const request = await pool.request();
    let passwordFinal = null;
    //if (password && !password.startsWith('$2a$')) {
    if (password && password.trim() !== "") {
      const salt = bcrypt.genSaltSync(10);
      passwordFinal = bcrypt.hashSync(password, salt);
    }

    await request
      .input("cedula", cedula)
      .input("nombres", nombres)
      .input("apellidos", apellidos)
      .input("usuario", usuario)
      .input("password", passwordFinal)
      .input("rol", rol || 'TECNICO')
      .input("estado", estado)
      .query(`
      UPDATE tecnicos
      SET
        nombres = @nombres,
        apellidos = @apellidos,
        usuario = @usuario,
        password = COALESCE(@password, password),
        rol= @rol,
        estado = @estado
      WHERE cedula = @cedula
      `);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar registro" },
      { status: 500 }
    );
  }
}
