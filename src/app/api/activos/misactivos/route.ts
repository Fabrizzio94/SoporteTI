import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { obtenerMisActivos } from "@/lib/services/activos/obtenerMisActivos";
import { Usuario } from "@/app/types/tecnico";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session)
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const user = session.user as Usuario;
    const resultado = await obtenerMisActivos(user.cedula);
    return NextResponse.json(resultado);
}