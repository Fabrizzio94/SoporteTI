import sql from "mssql";
import { ProcesarServidorParams } from "@/app/types/activo";

export const procesarServidor = async ({
  pool,
  codigo_activo,
  nombre_activo,
  descripcion,
  oficina
}: ProcesarServidorParams) => {
  // ── SERVIDOR ─────────────────────────────────────────────
  if (!esServidorPorDescripcion(nombre_activo, descripcion)) return;

  const yaExisteServidorenBD = await existeServidorenBD(pool, codigo_activo);

  if (yaExisteServidorenBD) return; // no se actualiza nada, ya existe un servidor marcado como principal

  const hayServidorPrincipal = await existeServidorPrincipalEnOficina(pool, oficina);
  await insertarServidorNuevo(pool, codigo_activo, !hayServidorPrincipal);

}

// helpers
const esServidorPorDescripcion = (
  nombre_activo: string,
  descripcion?: string | null
): boolean => nombre_activo === "CPU" && !!descripcion?.toUpperCase().includes("SERVIDOR");

const existeServidorenBD = async (pool: any, codigo_activo: string): Promise<boolean> => {
  const result = await pool.request()
    .input("codigo_activo", codigo_activo)
    .query(`SELECT 1 FROM servidor WHERE codigo_activo = @codigo_activo`);
  return result.recordset.length > 0;
}

const existeServidorPrincipalEnOficina = async (
  pool: any,
  oficina: string
): Promise<boolean> => {
  const result = await pool.request()
    .input("oficina", oficina)
    .query(`
        SELECT 1 FROM servidor s
        INNER JOIN activo a ON a.codigo_activo = s.codigo_activo
        WHERE a.oficina = @oficina
          AND a.nombre_activo = 'CPU'
          AND s.es_principal = 1
      `);
  return result.recordset.length > 0;
}

const insertarServidorNuevo = async (
  pool: any,
  codigo_activo: string,
  esPrincipal: boolean
): Promise<void> => {
  await pool.request()
    .input("codigo_activo", codigo_activo)
    .input("es_principal", sql.Bit, esPrincipal ? 1 : 0)
    .query(`
          INSERT INTO servidor (codigo_activo, virtualizer, ram, tipo_ram, so_servidor, es_principal)
          VALUES (@codigo_activo, null, null, null, null, @es_principal)
        `);
}

