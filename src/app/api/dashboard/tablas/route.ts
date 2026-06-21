import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Usuario } from "@/app/types/tecnico";
import { obtenerDatosTablaDashboard } from "@/lib/services/dashboard/dashboard-tablasService";
export async function GET() {
    const session = await getServerSession(authOptions);
    const user = session?.user as Usuario;
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const data = await obtenerDatosTablaDashboard(user.role, user.cedula);
    return NextResponse.json(data);
}