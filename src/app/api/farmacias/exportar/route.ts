import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { obtenerFarmaciasParaExportar } from "@/lib/services/farmacias/farmaciaService";
import { Usuario } from "@/app/types/tecnico";
import { error } from "console";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session)
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const user = session.user as Usuario;
        if (user.role !== "COORDINADOR") {
            return NextResponse.json({ error: "No tiene permisos para exportar." }, { status: 403 });
        }
        const farmacias = await obtenerFarmaciasParaExportar();

        const filas = farmacias.map((f) => ({
            "Oficina": f.oficina,
            "Nombre": f.nombre,
            "Tecnico": f.nombre_tecnico ?? "Sin asignar",
            "Tipo": f.tipo_farmacia,
            "Marca": f.marca,
            "Codigo Activo": f.codigo_activo ?? "",
            "Año de compra": f.ano_compra ?? "",
            "SSOO Servidor": f.so_servidor ?? "",
            "Tipo RAM": f.tipo_ram ?? "",
            "RAM(GB)": f.ram ?? "",
            "Tecn. terminales": f.tecnologia_terminales ?? "",
            "SO terminales": f.ssoo_terminales ?? "",
            "Virtualizador": f.virtualizer ?? "",
            "#PDV": f.num_puntos_venta ?? "",
            "Tipo Rack": f.tipo_rack ?? ""
        }));

        const ws = XLSX.utils.json_to_sheet(filas);

        ws["!cols"] = [
            { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 14 }, { wch: 14 },
            { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
            { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 14 },
            { wch: 16 }, { wch: 10 },
        ];

        if (ws["!ref"]) ws["!autofilter"] = { ref: ws["!ref"] };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Farmacias");

        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        const fecha = new Date().toISOString().slice(0, 10);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="farmacias_${fecha}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error exportando farmacias:", error);
        return NextResponse.json({ error: "Error al exportar farmacias" }, { status: 500 });
    }
}