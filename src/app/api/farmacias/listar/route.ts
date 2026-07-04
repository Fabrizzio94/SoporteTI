import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { obtenerFarmaciasListado } from "@/lib/services/farmacias/farmaciaService";

interface Usuario {
    cedula: string;
    role: string;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 },
            );
        }

        const user = session.user as Usuario;

        const farmacias = await obtenerFarmaciasListado(
            user.role,
            user.cedula,
        );

        return NextResponse.json(farmacias);
    } catch (error) {
        console.error("Error listando farmacias:", error);

        return NextResponse.json(
            { error: "Error al obtener farmacias" },
            { status: 500 },
        );
    }
}