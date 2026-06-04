import { getConnection } from "@/lib/db";
export const obtenerMisActivos = async (cedula: string) => {
  const pool = await getConnection();

  const tecnico = await pool.request()
    .input("cedula", cedula)
    .query(`
      SELECT UPPER(TRIM(apellidos + ' ' + nombres)) AS nombre_completo
      FROM tecnicos
      WHERE cedula = @cedula
    `);

  if (!tecnico.recordset[0]) return [];

  const nombreCompleto = tecnico.recordset[0].nombre_completo;

  const result = await pool.request()
    .input("nombre_custodio", nombreCompleto)
    .query(`
      SELECT
        a.codigo_activo,
        a.nombre_activo,
        a.ano_compra,
        a.estado,
        a.nombre_custodio,
        COALESCE(f.nombre, 'CONTACT CENTER OPERATIVO') AS nombre_farmacia
      FROM activo a
      LEFT JOIN farmacia f ON f.oficina = a.oficina
      WHERE UPPER(TRIM(a.nombre_custodio)) = @nombre_custodio
      ORDER BY a.nombre_activo
    `);

  return result.recordset;
};