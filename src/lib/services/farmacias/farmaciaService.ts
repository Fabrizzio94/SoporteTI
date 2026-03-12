import { getConnection } from "@/lib/db";
import { Farmacia } from "@/app/types/farmacia";
export const obtenerFarmacias = async (rol: string, cedula: string) => {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
    SELECT 
      f.*,
      t.apellidos + ' ' + t.nombres AS nombre_tecnico,
      srv.codigo_activo AS codigo_servidor,
      srv.ano_compra    AS ano_servidor,
      srv.so_servidor,
      srv.tipo_ram,
      srv.ram,
      srv.virtualizer
    FROM farmacia f
    LEFT JOIN tecnicos t ON t.cedula = f.cedula_tecnico
    OUTER APPLY (
      SELECT TOP 1
        a.codigo_activo,
        a.ano_compra,
        s.so_servidor,
        s.tipo_ram,
        s.ram,
        s.virtualizer
      FROM activo a
      INNER JOIN servidor s ON s.codigo_activo = a.codigo_activo
      WHERE a.oficina = f.oficina
        AND a.nombre_activo = 'CPU'
        AND a.estado = 'A'
      ORDER BY s.es_principal DESC, a.ano_compra DESC
    ) AS srv
  `;

    if (rol === "TECNICO") {
        request.input("cedula_sesion", cedula);
        query += ` WHERE f.cedula_tecnico = @cedula_sesion`;
    }

    query += ` ORDER BY nombre_tecnico ASC`;

    const result = await request.query(query);
    return result.recordset;
};

export const actualizarFarmacia = async (data: Pick<Farmacia, "oficina" | "tecnologia_terminales" | "ssoo_terminales" | "num_puntos_venta" | "tipo_rack" | "estado">) => {
    const pool = await getConnection();

    await pool.request()
        .input("oficina", data.oficina)
        .input("tecnologia_terminales", data.tecnologia_terminales ?? null)
        .input("ssoo_terminales", data.ssoo_terminales ?? null)
        .input("num_puntos_venta", data.num_puntos_venta ?? null)
        .input("tipo_rack", data.tipo_rack ?? null)
        .input("estado", data.estado)
        .query(`
      UPDATE farmacia SET
        tecnologia_terminales = @tecnologia_terminales,
        ssoo_terminales       = @ssoo_terminales,
        num_puntos_venta      = @num_puntos_venta,
        tipo_rack             = @tipo_rack,
        estado                = @estado
      WHERE oficina = @oficina
    `);

    return { ok: true };
};