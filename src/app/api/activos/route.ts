import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico";
import { obtenerActivos, crearActivo, actualizarActivo, verificarCodigoActivo } from "@/lib/services/activos/activoService";

export async function GET(req: Request) {
    try {
        // Verifica sesión — cualquier usuario autenticado puede acceder
        const session = await getServerSession(authOptions);
        if (!session)
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const user = session.user as Usuario;
        //const activos = await obtenerActivos(user.role, user.cedula);
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") ?? "1");
        const limit = parseInt(url.searchParams.get("limit") ?? "50");
        const busqueda = url.searchParams.get("busqueda") ?? "";
        const farmacia = url.searchParams.get("farmacia") ?? "";
        const tecnico = url.searchParams.get("tecnico") ?? "";
        const marca = url.searchParams.get("marca") ?? "";
        const codigo = url.searchParams.get("codigo");

        if (codigo) {
            const resultado = await verificarCodigoActivo(codigo);
            return NextResponse.json(resultado);
        }

        const resultado = await obtenerActivos(
            user.role,
            user.cedula,
            { busqueda, farmacia, tecnico, marca, page, limit }
        );

        return NextResponse.json(resultado);
        //return NextResponse.json(activos);

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

        const { codigo_activo, nombre_activo, fecha_compra, descripcion, oficina,
            virtualizer, ram, tipo_ram, so_servidor, es_principal } = await req.json();

        if (!codigo_activo || !nombre_activo || !oficina)
            return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });

        const resultado = await crearActivo({
            codigo_activo,
            nombre_activo,
            fecha_compra: fecha_compra ?? null,
            descripcion: descripcion ?? null,
            oficina,
            virtualizer, ram, tipo_ram, so_servidor, es_principal
        });

        return NextResponse.json(resultado);

    } catch (error: any) {
        console.error("Error POST activo:", error);
        if (error?.number === 2627 || error?.originalError?.number === 2627) {
            return NextResponse.json(
                { error: "El código de activo ya existe." },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: "Error al guardar activo" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        // Verifica sesión — cualquier usuario autenticado puede editar activos
        const session = await getServerSession(authOptions);
        if (!session)
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const { codigo_activo, nombre_activo, fecha_compra, descripcion, oficina,
            virtualizer, ram, tipo_ram, so_servidor, es_principal } = await req.json();

        if (!codigo_activo)
            return NextResponse.json({ error: "Código activo es obligatorio" }, { status: 400 });

        const resultado = await actualizarActivo({
            codigo_activo,
            nombre_activo,
            fecha_compra: fecha_compra ?? null,
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