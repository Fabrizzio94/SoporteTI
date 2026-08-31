import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";


import { Usuario } from "@/app/types/tecnico";
import { obtenerFarmacias, actualizarFarmacia } from "@/lib/services/farmacias/farmaciaService";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = session.user as Usuario;
    const url = new URL(req.url);

    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const search = url.searchParams.get("busqueda") ?? "";
    const estado = url.searchParams.get("estado") ?? "A";
    const tecnico = url.searchParams.get("tecnico") ?? "";
    const farmacias = await obtenerFarmacias(user.role, user.cedula, { page, limit, search, estado: estado as "A" | "I", tecnico, });
    return NextResponse.json(farmacias);

  } catch (error) {
    console.error("Error GET farmacias:", error);
    return NextResponse.json({ error: "Error al obtener farmacias" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { oficina, tecnologiaTerminales, soTerminales, numPuntosVenta, tipoRack, estado } = await req.json();

    if (!oficina)
      return NextResponse.json({ error: "Oficina es obligatoria" }, { status: 400 });

    const resultado = await actualizarFarmacia({
      oficina,
      tecnologia_terminales: tecnologiaTerminales ?? null,
      ssoo_terminales: soTerminales ?? null,
      num_puntos_venta: numPuntosVenta ?? null,
      tipo_rack: tipoRack ?? null,
      estado,
    });

    return NextResponse.json(resultado);

  } catch (error) {
    console.error("Error PUT farmacia:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}