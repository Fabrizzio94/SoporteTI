// helpers/servidor.ts
import sql from "mssql";
import { getConnection } from "@/lib/db";
import { Activo } from "@/app/types/activo";
type DatosServidor = Pick<Activo,
    "codigo_activo" | "nombre_activo" | "oficina" | "virtualizer" | "ram" |
    "tipo_ram" | "so_servidor" | "es_principal">;
/**
 * Desmarca todos los CPU de una oficina y marca como principal
 * únicamente el codigo_activo indicado.
 */
export const marcarComoPrincipal = async (
    pool: Awaited<ReturnType<typeof getConnection>>,
    oficina: string,
    codigoActivo: string
) => {
    await pool.request()
        .input("oficina", oficina)
        .input("codigo_activo", codigoActivo)
        .query(`
      UPDATE servidor SET es_principal = 0
      WHERE codigo_activo IN (
        SELECT codigo_activo FROM activo
        WHERE oficina = @oficina AND nombre_activo = 'CPU'
      ) AND codigo_activo <> @codigo_activo;

      UPDATE servidor SET es_principal = 1
      WHERE codigo_activo = @codigo_activo;
    `);
};

/**
 * Devuelve el codigo_activo del CPU marcado como principal
 * en una oficina, o null si no hay ninguno.
 */
export const obtenerPrincipalActual = async (
    pool: Awaited<ReturnType<typeof getConnection>>,
    oficina: string
): Promise<string | null> => {
    const result = await pool.request()
        .input("oficina", oficina)
        .query(`
      SELECT s.codigo_activo
      FROM servidor s
      INNER JOIN activo a ON a.codigo_activo = s.codigo_activo
      WHERE a.oficina = @oficina AND a.nombre_activo = 'CPU' AND s.es_principal = 1
    `);
    return result.recordset[0]?.codigo_activo ?? null;
};

/**
 * Si el activo es un CPU, guarda (inserta o actualiza) su fila en `servidor`
 * y garantiza que siempre haya exactamente un principal por oficina.
 * Si no es CPU, no hace nada y retorna null.
 */
export const guardarServidorEsCPU = async (
    pool: Awaited<ReturnType<typeof getConnection>>,
    data: DatosServidor
): Promise<boolean | null> => {
    if (data.nombre_activo !== "CPU") return null;
    // esPrincipalActual verifica si hay un servidor marcado como principal (es_principal = 1)
    const esPrincipalActual = await obtenerPrincipalActual(pool, data.oficina);
    const esElPrincipalActual = esPrincipalActual === data.codigo_activo;
    // Reglas de negocio para decidir el valor final del bit(es_principal):
    // - Si el usuario intenta desmarcar el único principal existente -> se fuerza a true (1).
    // - Si no existe ningún principal en la oficina (primer CPU) -> se fuerza a true (1).
    // - En cualquier otro caso, se respeta lo que mandó el usuario.
    const esPrincipalFinal = (!data.es_principal && esElPrincipalActual) ? true :
        (!esPrincipalActual) ? true :
            !!data.es_principal;

    const esPrincipalBit = esPrincipalFinal ? 1 : 0;
    await pool.request()
        .input("codigo_activo", data.codigo_activo)
        .input("virtualizer", data.virtualizer ?? null)
        .input("ram", data.ram ?? null)
        .input("tipo_ram", data.tipo_ram ?? null)
        .input("so_servidor", data.so_servidor ?? null)
        .input("es_principal", sql.Bit, esPrincipalBit)
        .query(`
            MERGE INTO servidor AS D
            USING (SELECT @codigo_activo AS codigo_activo) AS O
                ON D.codigo_activo = O.codigo_activo
            WHEN MATCHED THEN
                UPDATE SET
                virtualizer = @virtualizer,
                ram         = @ram,
                tipo_ram    = @tipo_ram,
                so_servidor = @so_servidor
            WHEN NOT MATCHED THEN
                INSERT (codigo_activo, virtualizer, ram, tipo_ram, so_servidor, es_principal)
                VALUES (@codigo_activo, @virtualizer, @ram, @tipo_ram, @so_servidor, @es_principal);
        `);
    if (esPrincipalFinal) {
        await marcarComoPrincipal(pool, data.oficina, data.codigo_activo);
    }
    return esPrincipalFinal;
}
