import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import { procesarSync } from "@/lib/services/farmacias/syncService";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as Usuario).role !== "COORDINADOR")
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const resultado = await procesarSync();
        return NextResponse.json(resultado);

    } catch (error) {
        console.error("Error en Sync:", error);
        return NextResponse.json({ error: "Error en la sincronización" }, { status: 500 });
    }
}