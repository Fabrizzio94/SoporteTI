import type { ProcesarCCParams } from "@/app/types/activo";
export const procesarCC = async ({
    pool,
    codigoActivo,
    nombreActivo,
    anoCompra,
    detalle,
    nombreCustodio,
    activosEnBD,
    resumen,
}: ProcesarCCParams): Promise<boolean> => {


    /*  if (!farmacia && !esContactCenter) {
         resumen.sin_farmacia.push(`${codigoActivo} - ${centroCosto}`);
         return;
     } */

    const tecnicoData = await pool.request()
        .input("nombre_custodio", nombreCustodio?.toUpperCase().trim() ?? "")
        .query(`
                SELECT cedula FROM tecnicos
                WHERE UPPER(TRIM(apellidos+' '+nombres))= @nombre_custodio`);
    const cedulaTecnico = tecnicoData.recordset[0]?.cedula ?? null;
    const esTecnico = await pool.request()
        .input("nombre_custodio", nombreCustodio?.toUpperCase().trim() ?? "")
        .query(`
            SELECT COUNT (*) AS total
            FROM tecnicos
            WHERE UPPER(TRIM(apellidos + ' '+ nombres))=@nombre_custodio `);
    if (esTecnico.recordset[0].total === 0) return true;
    const activoEnBD = activosEnBD.get(codigoActivo);
    if (activoEnBD) {
        await pool.request()
            .input("codigo_activo", codigoActivo)
            .input("nombre_custodio", nombreCustodio)
            .input("cedula_tecnico", cedulaTecnico)
            .query(`
                    UPDATE activo SET nombre_custodio = @nombre_custodio, cedula_tecnico=@cedula_tecnico
                    WHERE codigo_activo = @codigo_activo
                    `);
        resumen.actualizados++;
    } else {

        await pool.request()
            .input("codigo_activo", codigoActivo)
            .input("nombre_activo", nombreActivo)
            .input("ano_compra", anoCompra)
            .input("descripcion", detalle)
            .input("nombre_custodio", nombreCustodio)
            .input("cedula_tecnico", cedulaTecnico)
            .query(`
                INSERT INTO activo (codigo_activo, nombre_activo, ano_compra, descripcion, estado, nombre_custodio)
                VALUES (@codigo_activo, @nombre_activo, @ano_compra, @descripcion, 'A', @nombre_custodio)`
            );
        resumen.insertados++;
        activosEnBD.set(codigoActivo, {
            codigo_activo: codigoActivo,
            estado: "A",
            nombre_activo: nombreActivo,
            oficina: null,
            cedula_tecnico: null,
            ano_compra: anoCompra,
            tipo_farmacia: null,
            nombre_tecnico: null,
        });
    }
    return true;


}