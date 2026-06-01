import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import { obtenerFiltrosActivos } from "@/lib/services/activos/filtros";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const user = session.user as Usuario;

    const resultado = await obtenerFiltrosActivos(user.role, user.cedula);
    return NextResponse.json(resultado);
}