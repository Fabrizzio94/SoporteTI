import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import { obtenerActivos, crearActivo, actualizarActivo } from "@/lib/services/activos/activoService";

export async function GET(req: Request) {
    try {
        // Verifica sesión — cualquier usuario autenticado puede acceder
        const session = await getServerSession(authOptions);
        if (!session)
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const user = session.user as Usuario;
        const activos = await obtenerActivos(user.role, user.cedula);
        return NextResponse.json(activos);

    } catch (error) {
        console.error("Error GET activos:", error);
        return NextResponse.json({ error: "Error al obtener activos" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        // Verifica sesión — cualquier usuario autenticado puede crear activos
        const session = await getServerSession(authOptions);
        if (!session)
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const { codigo_activo, nombre_activo, ano_compra, descripcion, oficina,
            virtualizer, ram, tipo_ram, so_servidor } = await req.json();

        if (!codigo_activo || !nombre_activo || !oficina)
            return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });

        const resultado = await crearActivo({
            codigo_activo,
            nombre_activo,
            ano_compra: ano_compra ?? null,
            descripcion: descripcion ?? null,
            oficina,
            virtualizer, ram, tipo_ram, so_servidor,
        });

        return NextResponse.json(resultado);

    } catch (error) {
        console.error("Error POST activo:", error);
        return NextResponse.json({ error: "Error al guardar activo" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        // Verifica sesión — cualquier usuario autenticado puede editar activos
        const session = await getServerSession(authOptions);
        if (!session)
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const { codigo_activo, nombre_activo, ano_compra, descripcion, oficina,
            virtualizer, ram, tipo_ram, so_servidor, es_principal } = await req.json();

        if (!codigo_activo)
            return NextResponse.json({ error: "Código activo es obligatorio" }, { status: 400 });

        const resultado = await actualizarActivo({
            codigo_activo,
            nombre_activo,
            ano_compra: ano_compra ?? null,
            descripcion: descripcion ?? null,
            oficina,
            virtualizer, ram, tipo_ram, so_servidor, es_principal,
        });

        return NextResponse.json(resultado);

    } catch (error) {
        console.error("Error PUT activo:", error);
        return NextResponse.json({ error: "Error al actualizar activo" }, { status: 500 });
    }
}