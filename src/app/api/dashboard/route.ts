import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { obtenerDatosDashboard } from "@/lib/services/dashboard/dashboardService";
import { Usuario } from "@/app/types/tecnico";

export async function GET() {
    const session = await getServerSession(authOptions);
    const user = session?.user as Usuario;
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const data = await obtenerDatosDashboard(user.role, user.cedula);
    return NextResponse.json(data);
}