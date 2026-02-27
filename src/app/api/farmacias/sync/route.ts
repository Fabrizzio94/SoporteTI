import { NextResponse } from "next/server";
import { getConnection, getMatrizConnection } from "@/lib/db";
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
        // Consulta a matriz la informacion a trabajar
        const poolMatriz = await getMatrizConnection();
        const poolLocal = await getConnection();
        const resultMatriz = await poolMatriz.request().query(`
            SELECT 
                OFI.OFICINA AS OFICINA,
                OFI.NOMBRE AS FARMACIA,
                AT.tec_cedula AS CEDULA_TECNICO,
                CONCAT(AT.tec_apellido, ' ', AT.tec_nombre) AS TECNICO,
                AT.tec_nombre AS NOMBRES,
                AT.tec_apellido AS APELLIDOS,
                SU.NOMBRE AS SUCURSAL,
                OFI.ES_FRANQUICIA AS FRANQUICIA,
                US.NombreCorto AS USUARIO
            FROM DBO.OFICINA AS OFI WITH(NOLOCK)
            INNER JOIN [dbo].[SP_PAR_AsignacionFarmacias] AS AF ON OFI.Oficina = AF.af_idoficina
            INNER JOIN [dbo].[SP_PAR_Tecnicos] AS AT ON AF.af_cedula = AT.tec_cedula
            INNER JOIN COMISIONES.BDGENERAL.DBO.SUCURSALES AS SU 
                ON SU.CODIGO_SUCURSAL COLLATE SQL_Latin1_General_CP1_CI_AS = OFI.SUCURSAL COLLATE SQL_Latin1_General_CP1_CI_AS
            LEFT JOIN EasySeguridad.dbo.usuarios as US
                ON US.cedula = AT.tec_cedula
            WHERE OFI.ESTADO = 'A'
        `);
        const listaMatriz = resultMatriz.recordset;
        const tecnicosProcesados = new Set<string>();
        // MERGE: Actualizar si existe, insertar si es nueva
        for (const f of listaMatriz) {
            // TECNICOS
            if (f.CEDULA_TECNICO && !tecnicosProcesados.has(f.CEDULA_TECNICO)) {
                tecnicosProcesados.add(f.CEDULA_TECNICO);

                await poolLocal
                    .request()
                    .input("cedula", f.CEDULA_TECNICO)
                    .input("nombres", f.NOMBRES)
                    .input("apellidos", f.APELLIDOS)
                    .input("usuario", f.USUARIO ?? null).query(`
                    IF NOT EXISTS (SELECT 1 FROM tecnicos WHERE cedula = @cedula)
                    BEGIN
                        INSERT INTO tecnicos (cedula, nombres, apellidos, estado, rol, usuario)
                        VALUES (@cedula, @nombres, @apellidos, 'A', 'TECNICO', @usuario)
                    END
                    ELSE
                    BEGIN
                        UPDATE tecnicos
                        SET usuario = @usuario, nombres = @nombres, apellidos = @apellidos
                        WHERE cedula = @cedula AND usuario IS NULL
                    END
                `);
            }
            // FARMACIAS
            await poolLocal.request()
                .input("oficina", f.OFICINA)
                .input("nombre", f.FARMACIA)
                .input("cedula_tecnico", f.CEDULA_TECNICO)
                .input("tipo", f.FRANQUICIA === 'S' ? 'Franquicia' : 'Propia')
                // Asignamos una marca por defecto basada en el tipo si no existe
                .input("marca", f.SUCURSAL)
                .query(`
                MERGE INTO farmacia AS Destino
                USING (SELECT @oficina AS oficina) AS Origen
                ON Destino.oficina = Origen.oficina
                WHEN MATCHED THEN
                    UPDATE SET 
                    nombre = @nombre,
                    cedula_tecnico = @cedula_tecnico,
                    tipo_farmacia = @tipo,
                    estado = 'A'
                WHEN NOT MATCHED THEN
                    INSERT (oficina, nombre, cedula_tecnico, tipo_farmacia, marca, estado)
                    VALUES (@oficina, @nombre, @cedula_tecnico, @tipo, @marca, 'A');
                `);
        }
        // INACTIVAR: Las que ya no vinieron en la consulta de Matriz
        const oficinasVivas = listaMatriz.map(f => `'${f.OFICINA}'`).join(",");
        if (oficinasVivas.length > 0) {
            await poolLocal.request().query(`
            UPDATE farmacia 
            SET estado = 'I' 
            WHERE oficina NOT IN (${oficinasVivas})
        `);
        }


        return NextResponse.json({ ok: true, message: "Sincronización completada", count: listaMatriz.length });
    } catch (error) {
        console.error("error en Sync:", error);
        return NextResponse.json({ error: "Error en la sincronización" }, { status: 500 });
    }
}
