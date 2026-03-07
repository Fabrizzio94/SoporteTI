import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { error } from "console";
import { Usuario } from "@/app/types/tecnico";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "No Autorizado" }, { status: 403 });
        const user = session.user as Usuario;
        const pool = await getConnection();
        const whereExtra = user.role === "TECNICO" ? `AND t.cedula = '${user.cedula}'` : "";
        const result = await pool.request().query(`
      SELECT 
        a.codigo_activo,
        a.nombre_activo,
        a.ano_compra,
        a.descripcion,
        a.estado,
        a.oficina,
        f.nombre        AS nombre_farmacia,
        f.marca AS marca_farmacia,
        t.apellidos + ' ' + t.nombres AS nombre_tecnico,
        f.cedula_tecnico,
        s.virtualizer,
        s.ram,
        s.tipo_ram,
        s.so_servidor
      FROM activo a
      INNER JOIN farmacia f ON f.oficina = a.oficina
      LEFT JOIN tecnicos t  ON t.cedula = f.cedula_tecnico
      LEFT JOIN servidor s  ON s.codigo_activo = a.codigo_activo
      WHERE a.estado = 'A' ${whereExtra}
      ORDER BY f.nombre, a.nombre_activo
    `);
        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error("Error GET activos:", error);
        return NextResponse.json({ error: "Error al obtener activos" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const body = await req.json();
        const { codigo_activo, nombre_activo, ano_compra, descripcion, oficina,
            virtualizer, ram, tipo_ram, so_servidor } = body;

        if (!codigo_activo || !nombre_activo || !oficina) {
            return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
        }

        const pool = await getConnection();

        // Insertar activo
        await pool.request()
            .input("codigo_activo", codigo_activo)
            .input("nombre_activo", nombre_activo)
            .input("ano_compra", ano_compra ?? null)
            .input("descripcion", descripcion ?? null)
            .input("oficina", oficina)
            .query(`
        IF NOT EXISTS (SELECT 1 FROM activo WHERE codigo_activo = @codigo_activo)
        BEGIN
          INSERT INTO activo (codigo_activo, nombre_activo, ano_compra, descripcion, estado, oficina)
          VALUES (@codigo_activo, @nombre_activo, @ano_compra, @descripcion, 'A', @oficina)
        END
      `);

        // Si es CPU → insertar en servidor
        if (nombre_activo === "CPU") {
            await pool.request()
                .input("codigo_activo", codigo_activo)
                .input("virtualizer", virtualizer ?? null)
                .input("ram", ram ?? null)
                .input("tipo_ram", tipo_ram ?? null)
                .input("so_servidor", so_servidor ?? null)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM servidor WHERE codigo_activo = @codigo_activo)
          BEGIN
            INSERT INTO servidor (codigo_activo, virtualizer, ram, tipo_ram, so_servidor)
            VALUES (@codigo_activo, @modelo, @virtualizer, @ram, @tipo_ram, @so_servidor)
          END
        `);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error POST activo:", error);
        return NextResponse.json({ error: "Error al guardar activo" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const body = await req.json();
        const { codigo_activo, nombre_activo, ano_compra, descripcion, oficina,
            virtualizer, ram, tipo_ram, so_servidor, es_principal } = body;

        const pool = await getConnection();

        await pool.request()
            .input("codigo_activo", codigo_activo)
            .input("nombre_activo", nombre_activo)
            .input("ano_compra", ano_compra ?? null)
            .input("descripcion", descripcion ?? null)
            .input("oficina", oficina)
            .query(`
        UPDATE activo SET
          nombre_activo = @nombre_activo,
          ano_compra    = @ano_compra,
          descripcion   = @descripcion,
          oficina       = @oficina
        WHERE codigo_activo = @codigo_activo
      `);

        // Si es CPU → actualizar servidor
        if (nombre_activo === "CPU") {
            await pool.request()
                .input("codigo_activo", codigo_activo)
                .input("virtualizer", virtualizer ?? null)
                .input("ram", ram ?? null)
                .input("tipo_ram", tipo_ram ?? null)
                .input("so_servidor", so_servidor ?? null)
                .query(`
          MERGE INTO servidor AS D
          USING (SELECT @codigo_activo AS codigo_activo) AS O
            ON D.codigo_activo = O.codigo_activo
          WHEN MATCHED THEN
            UPDATE SET virtualizer=@virtualizer,
                       ram=@ram, tipo_ram=@tipo_ram, so_servidor=@so_servidor
          WHEN NOT MATCHED THEN
            INSERT (codigo_activo, virtualizer, ram, tipo_ram, so_servidor, es_principal)
            VALUES (@codigo_activo, @virtualizer, @ram, @tipo_ram, @so_servidor,0);
        `);
            if (es_principal) {
                await pool.request()
                    .input("oficina", oficina)
                    .input("codigo_activo", codigo_activo)
                    .query(`
            -- Desmarcar todos los servidores de esta farmacia
            UPDATE servidor SET es_principal = 0
            WHERE codigo_activo IN (
              SELECT codigo_activo FROM activo 
              WHERE oficina = @oficina AND nombre_activo = 'CPU'
            );
            -- Marcar este como principal
            UPDATE servidor SET es_principal = 1
            WHERE codigo_activo = @codigo_activo;
          `);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error PUT activo:", error);
        return NextResponse.json({ error: "Error al actualizar activo" }, { status: 500 });
    }
}