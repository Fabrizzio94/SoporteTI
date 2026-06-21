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