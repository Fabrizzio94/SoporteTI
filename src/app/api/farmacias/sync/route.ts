import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Usuario } from "@/app/types/tecnico"
export async function POST() {
    try {
        // Seguridad: Solo el COORDINADOR puede sincronizar
        const session = await getServerSession(authOptions);
        if (!session || (session.user as Usuario).role !== "COORDINADOR") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Obtener data del servidor principal (Usa tu función de Windows Auth)
        // const dataPrincipal = await getPrincipalData(); 

        const poolLocal = await getConnection();

        // 3. Simulación de bucle de sincronización (Upsert)
        // Aquí pondrás los datos que vienen de la consulta que me pasaste
        /*
        for (const f of dataPrincipal) {
          await poolLocal.request()
            .input("oficina", f.OFICINA)
            .input("nombre", f.FARMACIA)
            .input("cedula_tecnico", f.CEDULA_TECNICO)
            .query(`
              MERGE INTO farmacia AS Destino
              USING (SELECT @oficina AS oficina) AS Origen
              ON Destino.oficina = Origen.oficina
              WHEN MATCHED THEN
                UPDATE SET 
                  nombre = @nombre,
                  cedula_tecnico = @cedula_tecnico
              WHEN NOT MATCHED THEN
                INSERT (oficina, nombre, cedula_tecnico, estado, ano_apertura)
                VALUES (@oficina, @nombre, @cedula_tecnico, 'A', YEAR(GETDATE()));
            `);
        }
        */

        return NextResponse.json({ ok: true, message: "Sincronización completada" });
    } catch (error) {
        return NextResponse.json({ error: "Error en la sincronización" }, { status: 500 });
    }
}
