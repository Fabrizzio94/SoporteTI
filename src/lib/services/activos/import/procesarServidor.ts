import { ConnectionPool } from "mssql";
import { ProcesarServidorParams } from "@/app/types/activo";

export const procesarServidor = async ({
    pool,
    codigo_activo,
    nombre_activo,
    descripcion,
    oficina
}: ProcesarServidorParams) => {
    // ── SERVIDOR ─────────────────────────────────────────────
    const esServidor = nombre_activo === "CPU" && descripcion?.toUpperCase().includes("SERVIDOR");
    if (esServidor) {
        await pool.request()
            .input("codigo_activo", codigo_activo)
            .input("oficina", oficina)
            .query(`
          MERGE INTO servidor AS D
          USING (SELECT @codigo_activo AS codigo_activo) AS O
            ON D.codigo_activo = O.codigo_activo
          WHEN MATCHED THEN
            UPDATE SET es_principal = CASE
              WHEN D.es_principal = 1 THEN 1
              WHEN NOT EXISTS (
                SELECT 1 FROM servidor s2
                INNER JOIN activo a2 ON a2.codigo_activo = s2.codigo_activo
                WHERE a2.oficina = @oficina
                  AND a2.nombre_activo = 'CPU'
                  AND s2.es_principal = 1
                  AND s2.codigo_activo != D.codigo_activo
              ) THEN 1 ELSE 0 END
          WHEN NOT MATCHED THEN
            INSERT (codigo_activo, virtualizer, ram, tipo_ram, so_servidor, es_principal)
            VALUES (@codigo_activo, null, null, null, null,
              CASE WHEN NOT EXISTS (
                SELECT 1 FROM servidor s2
                INNER JOIN activo a2 ON a2.codigo_activo = s2.codigo_activo
                WHERE a2.oficina = @oficina
                  AND a2.nombre_activo = 'CPU'
                  AND s2.es_principal = 1
              ) THEN 1 ELSE 0 END
            );
        `);
    }
}