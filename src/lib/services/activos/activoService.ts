import { getConnection } from "@/lib/db";
import { Activo } from "@/app/types/activo";
export const obtenerActivos = async (rol: string, cedula: string) => {
  const pool = await getConnection();
  const whereExtra = rol === "TECNICO" ? `AND t.cedula = '${cedula}'` : "";

  const result = await pool.request().query(`
    SELECT
      a.codigo_activo,
      a.nombre_activo,
      a.ano_compra,
      a.descripcion,
      a.estado,
      a.oficina,
      f.nombre           AS nombre_farmacia,
      f.marca            AS marca_farmacia,
      t.apellidos + ' ' + t.nombres AS nombre_tecnico,
      f.cedula_tecnico,
      s.virtualizer,
      s.ram,
      s.tipo_ram,
      s.so_servidor
    FROM activo a
    INNER JOIN farmacia f ON f.oficina = a.oficina
    LEFT JOIN tecnicos t  ON t.cedula  = f.cedula_tecnico
    LEFT JOIN servidor s  ON s.codigo_activo = a.codigo_activo
    WHERE a.estado = 'A' ${whereExtra} 
    ORDER BY f.nombre, a.nombre_activo
  `);

  return result.recordset;
};

export const crearActivo = async (data: Pick<Activo,
  "codigo_activo" | "nombre_activo" | "ano_compra" | "descripcion"
  | "oficina" | "virtualizer" | "ram" | "tipo_ram" | "so_servidor">) => {
  const pool = await getConnection();

  await pool.request()
    .input("codigo_activo", data.codigo_activo)
    .input("nombre_activo", data.nombre_activo)
    .input("ano_compra", data.ano_compra ?? null)
    .input("descripcion", data.descripcion ?? null)
    .input("oficina", data.oficina)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM activo WHERE codigo_activo = @codigo_activo)
      BEGIN
        INSERT INTO activo (codigo_activo, nombre_activo, ano_compra, descripcion, estado, oficina)
        VALUES (@codigo_activo, @nombre_activo, @ano_compra, @descripcion, 'A', @oficina)
      END
    `);

  if (data.nombre_activo === "CPU") {
    await pool.request()
      .input("codigo_activo", data.codigo_activo)
      .input("virtualizer", data.virtualizer ?? null)
      .input("ram", data.ram ?? null)
      .input("tipo_ram", data.tipo_ram ?? null)
      .input("so_servidor", data.so_servidor ?? null)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM servidor WHERE codigo_activo = @codigo_activo)
        BEGIN
          INSERT INTO servidor (codigo_activo, virtualizer, ram, tipo_ram, so_servidor)
          VALUES (@codigo_activo, @virtualizer, @ram, @tipo_ram, @so_servidor)
        END
      `);
    // vincular a tabla farmacia
    await pool.request()
      .input("oficina", data.oficina)
      .input("codigo_activo", data.codigo_activo)
      .input("ano_compra", data.ano_compra ?? null)
      .query(
        `
        UPDATE activo SET
          codigo_activo = @codigo_activo,
          ano_compra = @ano_compra
        WHERE oficina = @oficina
        `
      )
  }

  return { ok: true };
};

export const actualizarActivo = async (data: Pick<Activo,
  "codigo_activo" | "nombre_activo" | "ano_compra" | "descripcion"
  | "oficina" | "virtualizer" | "ram" | "tipo_ram" | "so_servidor" | "es_principal">) => {
  const pool = await getConnection();

  await pool.request()
    .input("codigo_activo", data.codigo_activo)
    .input("nombre_activo", data.nombre_activo)
    .input("ano_compra", data.ano_compra ?? null)
    .input("descripcion", data.descripcion ?? null)
    .input("oficina", data.oficina)
    .query(`
      UPDATE activo SET
        nombre_activo = @nombre_activo,
        ano_compra    = @ano_compra,
        descripcion   = @descripcion,
        oficina       = @oficina
      WHERE codigo_activo = @codigo_activo
    `);

  if (data.nombre_activo === "CPU") {
    await pool.request()
      .input("codigo_activo", data.codigo_activo)
      .input("virtualizer", data.virtualizer ?? null)
      .input("ram", data.ram ?? null)
      .input("tipo_ram", data.tipo_ram ?? null)
      .input("so_servidor", data.so_servidor ?? null)
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
          VALUES (@codigo_activo, @virtualizer, @ram, @tipo_ram, @so_servidor, 0);
      `);

    if (data.es_principal) {
      await pool.request()
        .input("oficina", data.oficina)
        .input("codigo_activo", data.codigo_activo)
        .query(`
          UPDATE servidor SET es_principal = 0
          WHERE codigo_activo IN (
            SELECT codigo_activo FROM activo
            WHERE oficina = @oficina AND nombre_activo = 'CPU'
          );
          UPDATE servidor SET es_principal = 1
          WHERE codigo_activo = @codigo_activo;
        `);
    }
  }

  return { ok: true };
};