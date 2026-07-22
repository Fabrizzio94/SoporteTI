import { getConnection } from "@/lib/db";
export const obtenerHistoricoActivo = async (codigoActivo: string) => {
    const pool = await getConnection();

    const result = await pool.request()
        .input("codigo_activo", codigoActivo)
        .query(`
            SELECT
                id,
                codigo_activo,
                tipo_baja,
                motivo_baja,
                observacion,
                oficina,
                nombre_activo,
                fecha_baja,
                fecha_verificacion,
                verificado,
                nombre_tecnico
            FROM historico_activo
            WHERE codigo_activo = @codigo_activo
            ORDER BY fecha_baja DESC
            `);
    return result.recordset;
}