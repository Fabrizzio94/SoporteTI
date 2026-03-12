// /app/api/activos/baja/route.ts
import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Tecnico } from "@/app/types/tecnico";
import { procesarBajaActivo } from "@/lib/services/activos/bajaService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const user = session.user as Tecnico;
    const { codigo_activo, motivo_baja, observacion, codigo_reemplazo } = await req.json();

    if (!codigo_activo || !motivo_baja)
      return NextResponse.json({ error: "Código y motivo son obligatorios" }, { status: 400 });

    const resultado = await procesarBajaActivo(
      codigo_activo,
      motivo_baja,
      user.cedula,
      observacion,
      codigo_reemplazo
    );

    if (!resultado)
      return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });

    return NextResponse.json(resultado);

  } catch (error) {
    console.error("Error baja activo:", error);
    return NextResponse.json({ error: "Error al dar de baja" }, { status: 500 });
  }
}