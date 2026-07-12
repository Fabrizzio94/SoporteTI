import type { ConnectionPool } from "mssql";

export async function obtenerActivosBD(pool: ConnectionPool) {

    const result = await pool.request().query(`
        SELECT 
        a.codigo_activo,
        a.estado,
        a.nombre_activo,
        a.oficina,
        a.cedula_tecnico,
        a.ano_compra,
        f.tipo_farmacia,
        t.apellidos + ' ' + t.nombres AS nombre_tecnico
        FROM activo a
        LEFT JOIN farmacia f ON f.oficina = a.oficina
        LEFT JOIN tecnicos t ON t.cedula = a.cedula_tecnico
    `);

    return new Map(
        result.recordset.map((a: any) => [a.codigo_activo, a])
    );
}