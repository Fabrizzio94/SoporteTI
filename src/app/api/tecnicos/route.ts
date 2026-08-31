import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import { obtenerTecnicos, crearTecnico, actualizarTecnico } from "@/lib/services/tecnicos/tecnicoService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    /* if (!session || (session.user as Usuario).role !== "COORDINADOR")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 }); */

    const data = await obtenerTecnicos();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error GET técnicos:", error);
    return NextResponse.json({ error: "Error al obtener técnicos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as Usuario).role !== "COORDINADOR")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { cedula, nombres, apellidos, password, rol, usuario } = await req.json();

    if (!cedula || !nombres || !apellidos || !password || !usuario)
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });

    const resultado = await crearTecnico({ cedula, nombres, apellidos, password, rol, usuario });
    return NextResponse.json(resultado);

  } catch (error) {
    console.error("Error POST técnico:", error);
    return NextResponse.json({ error: "Error al insertar registro" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as Usuario).role !== "COORDINADOR")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { cedula, nombres, apellidos, usuario, password, rol, estado } = await req.json();

    if (!cedula)
      return NextResponse.json({ error: "Cédula es obligatoria" }, { status: 400 });

    const resultado = await actualizarTecnico({ cedula, nombres, apellidos, usuario, password, rol, estado });
    return NextResponse.json(resultado);

  } catch (error) {
    console.error("Error PUT técnico:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}