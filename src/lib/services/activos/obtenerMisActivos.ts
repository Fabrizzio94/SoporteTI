import { getConnection } from "@/lib/db";
import { obtenerCentroCosto } from "./activoService";
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
        COALESCE(f.nombre, 'CONTACT CENTER OPERATIVO') AS nombre_farmacia,
        a.cedula_tecnico,
        a.nombre_custodio,
        a.descripcion
      FROM activo a
      LEFT JOIN farmacia f ON f.oficina = a.oficina
      WHERE UPPER(TRIM(a.nombre_custodio)) = @nombre_custodio AND a.oficina is null
      ORDER BY a.nombre_activo
    `);

  return result.recordset;
};

export const asignarMisActivos = async (data: {
  codigo_activo: string,
  oficina: string;
}) => {
  const pool = await getConnection();
  const centroCosto = await obtenerCentroCosto(data.oficina);
  await pool.request()
    .input("codigo_activo", data.codigo_activo)
    .input("oficina", data.oficina)
    .input("centro_costo", centroCosto)
    .query(`
      UPDATE activo 
      SET 
        oficina = @oficina,
        control_importacion = 1,
        nombre_custodio = 'TODO EL PERSONAL DEL PDV',
        centro_costo = @centro_costo
      WHERE codigo_activo = @codigo_activo
    `);

  return { ok: true };
};