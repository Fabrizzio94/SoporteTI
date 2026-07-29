import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { obtenerMisActivos, asignarMisActivos } from "@/lib/services/activos/obtenerMisActivos";
import { Usuario } from "@/app/types/tecnico";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session)
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        const { codigo_activo, oficina } = await req.json();
        if (!codigo_activo || !oficina) {
            return NextResponse.json(
                { error: "Datos incompletos" },
                { status: 400 }
            );
        }
        const resultado = await asignarMisActivos({
            codigo_activo,
            oficina,
        });
        return NextResponse.json(resultado);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al asignar activo" }, { status: 500 });
    }
}