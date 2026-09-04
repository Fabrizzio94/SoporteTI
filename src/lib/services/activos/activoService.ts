import { getConnection } from "@/lib/db";
import { Activo } from "@/app/types/activo";
import sql from "mssql";
import { guardarServidorEsCPU, marcarComoPrincipal, obtenerPrincipalActual } from "@/lib/helpers/servidorHelper";

export const obtenerActivos = async (rol: string, cedula: string,
  filtros: {
    busqueda?: string;
    farmacia?: string;
    tecnico?: string;
    marca?: string;
    page?: number;
    limit?: number;
  }) => {
  const pool = await getConnection();
  const limit = filtros.limit ?? 50;
  const offset = ((filtros.page ?? 1) - 1) * limit;

  const conditions: string[] = ["a.estado = 'A'"];
  const request = pool.request();
  const requestCount = pool.request();

  if (rol === "TECNICO") {
    conditions.push("t.cedula = @cedula");
    request.input("cedula", cedula);
    requestCount.input("cedula", cedula);
  } else if (filtros.tecnico) {
    conditions.push("t.cedula = @tecnico OR (t.apellidos + ' ' + t.nombres) = @tecnico");
    request.input("tecnico", filtros.tecnico);
    requestCount.input("tecnico", filtros.tecnico);
  }
  if (filtros.busqueda) {
    conditions.push(`(
      a.codigo_activo LIKE @busqueda OR
      a.nombre_activo LIKE @busqueda OR
      f.nombre        LIKE @busqueda OR
      a.descripcion   LIKE @busqueda
      )`);
    request.input("busqueda", `%${filtros.busqueda}%`);
    requestCount.input("busqueda", `%${filtros.busqueda}%`);
  }
  if (filtros.farmacia) {
    conditions.push("f.nombre = @farmacia");
    request.input("farmacia", filtros.farmacia);
    requestCount.input("farmacia", filtros.farmacia);
  }

  if (filtros.marca) {
    conditions.push("f.marca = @marca");
    request.input("marca", filtros.marca);
    requestCount.input("marca", filtros.marca);
  }

  const whereClause = "WHERE " + conditions.join(" AND ");

  request
    .input("limit", limit)
    .input("offset", offset);

  const [result, countResult] = await Promise.all([
    request.query(`
      SELECT
        a.codigo_activo,
        a.nombre_activo,
        a.fecha_compra,
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
        s.so_servidor,
        a.centro_costo,
        s.es_principal
      FROM activo a
      INNER JOIN farmacia f ON f.oficina = a.oficina
      LEFT JOIN tecnicos t  ON t.cedula  = f.cedula_tecnico
      LEFT JOIN servidor s  ON s.codigo_activo = a.codigo_activo
      ${whereClause}
      ORDER BY f.nombre, a.nombre_activo
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `),
    requestCount.query(`
      SELECT COUNT(*) AS total
      FROM activo a
      INNER JOIN farmacia f ON f.oficina = a.oficina
      LEFT JOIN tecnicos t  ON t.cedula  = f.cedula_tecnico
      ${whereClause}
    `)
  ]);

  return {
    data: result.recordset,
    total: countResult.recordset[0].total,
  };

};
export const crearActivo = async (data: Pick<Activo,
  "codigo_activo" | "nombre_activo" | "fecha_compra" | "descripcion"
  | "oficina" | "virtualizer" | "ram" | "tipo_ram" | "so_servidor" | "es_principal">) => {
  const pool = await getConnection();
  const centroCosto = await obtenerCentroCosto(data.oficina);
  await pool.request()
    .input("codigo_activo", data.codigo_activo)
    .input("nombre_activo", data.nombre_activo)
    .input("fecha_compra", data.fecha_compra ?? null)
    .input("descripcion", data.descripcion ?? null)
    .input("oficina", data.oficina)
    .input("centro_costo", centroCosto)
    .query(`
    IF NOT EXISTS (SELECT 1 FROM activo WHERE codigo_activo = @codigo_activo)
    BEGIN
      INSERT INTO activo (codigo_activo, nombre_activo, descripcion, estado, oficina, control_importacion, centro_costo,fecha_compra)
      VALUES (@codigo_activo, @nombre_activo, @descripcion, 'A', @oficina,0, @centro_costo, @fecha_compra)
    END
  `);
  const esPrincipalFinal = await guardarServidorEsCPU(pool, data);
  return { ok: true, es_principal: esPrincipalFinal };

};

export const actualizarActivo = async (data: Pick<Activo,
  "codigo_activo" | "nombre_activo" | "fecha_compra" | "descripcion"
  | "oficina" | "virtualizer" | "ram" | "tipo_ram" | "so_servidor" | "es_principal">) => {
  const pool = await getConnection();
  const centroCosto = await obtenerCentroCosto(data.oficina);
  const sql = require("mssql");
  await pool.request()
    .input("codigo_activo", data.codigo_activo)
    .input("nombre_activo", data.nombre_activo)
    .input("fecha_compra", sql.Date, data.fecha_compra ?? null)
    .input("descripcion", data.descripcion ?? null)
    .input("oficina", data.oficina)
    .input("centro_costo", centroCosto)
    .query(`
      UPDATE activo SET
        nombre_activo = @nombre_activo,
        fecha_compra  = COALESCE(@fecha_compra, fecha_compra),
        descripcion   = @descripcion,
        oficina       = @oficina,
        centro_costo  = @centro_costo
      WHERE codigo_activo = @codigo_activo
    `);
  const esPrincipalFinal = await guardarServidorEsCPU(pool, data);
  return { ok: true, es_principal: esPrincipalFinal };


};

export const verificarCodigoActivo = async (codigo: string) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input("codigo", codigo)
    .query(`SELECT 1 AS encontrado FROM activo WHERE codigo_activo = @codigo`);
  return { existe: result.recordset.length > 0 };
}

export const obtenerCentroCosto = async (
  oficina: string
) => {
  const pool = await getConnection();
  const result = await pool.request()
    .input("oficina", oficina)
    .query(`
      SELECT centro_costo
      FROM farmacia
      WHERE oficina = @oficina
      `);
  return result.recordset[0]?.centro_costo ?? null;
}
