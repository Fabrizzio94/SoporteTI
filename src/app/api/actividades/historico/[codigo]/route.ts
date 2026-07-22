import { obtenerHistoricoActivo } from "@/lib/services/actividades/historicoService";
import { NextResponse } from "next/server";

export async function GET(req: Request,
    { params }: { params: Promise<{ codigo: string }> }
) {
    try {
        const { codigo } = await params;
        const historico = await obtenerHistoricoActivo(codigo);
        return NextResponse.json(historico);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Error obteniendo historial" },
            { status: 500 }
        );
    }

}