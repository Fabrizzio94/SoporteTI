import { getConnection } from "@/lib/db";
import { Farmacia } from "@/app/types/farmacia";
export const obtenerFarmacias = async (rol: string, cedula: string,
  filtros: {
    search?: string;
    page?: number;
    limit?: number;
    estado?: "A" | "I";
    tecnico?: string;
  }
) => {
  const pool = await getConnection();
  const limit = filtros.limit ?? 50;
  const offset = ((filtros.page ?? 1) - 1) * limit;
  const request = pool.request();
  const requestCount = pool.request();
  const requestStats = pool.request();
  const requestTecnicos = pool.request();
  const orderBy = filtros.tecnico
    ? "ORDER BY f.nombre ASC"
    : "ORDER BY t.apellidos ASC, t.nombres ASC";
  let whereClause = "";
  if (rol === "TECNICO") {
    request.input("cedula_sesion", cedula);
    requestCount.input("cedula_sesion", cedula);
    requestStats.input("cedula_sesion", cedula);
    requestTecnicos.input("cedula_sesion", cedula);
    whereClause += " WHERE f.cedula_tecnico = @cedula_sesion"
  }
  if (filtros.search) {
    request.input("search", `%${filtros.search}%`);
    requestCount.input("search", `%${filtros.search}%`);
    requestStats.input("search", `%${filtros.search}%`);
    requestTecnicos.input("search", `%${filtros.search}%`);
    whereClause += whereClause ? " AND" : " WHERE";
    whereClause += ` (f.nombre LIKE @search OR f.oficina LIKE @search OR t.apellidos + ' '+ t.nombres LIKE @search OR f.marca LIKE @search)`;

  }
  if (filtros.estado) {
    request.input("estado", filtros.estado);
    requestCount.input("estado", filtros.estado);
    requestStats.input("estado", filtros.estado);
    requestTecnicos.input("estado", filtros.estado);
    whereClause += whereClause ? " AND" : " WHERE";
    whereClause += " f.estado = @estado";
  }
  if (filtros.tecnico) {
    request.input("tecnico", filtros.tecnico);
    requestCount.input("tecnico", filtros.tecnico);
    requestStats.input("tecnico", filtros.tecnico);
    requestTecnicos.input("tecnico", filtros.tecnico);
    whereClause += whereClause ? " AND" : " WHERE";
    whereClause += " t.apellidos + ' ' + t.nombres = @tecnico";
  }
  const baseQuery = `
    FROM farmacia f
    LEFT JOIN tecnicos t ON t.cedula = f.cedula_tecnico
    OUTER APPLY (
      SELECT TOP 1
        a.codigo_activo,
        a.fecha_compra,
        s.so_servidor,
        s.tipo_ram,
        s.ram,
        s.virtualizer
      FROM activo a
      INNER JOIN servidor s ON s.codigo_activo = a.codigo_activo
      WHERE a.oficina = f.oficina
        AND a.nombre_activo = 'CPU'
        AND a.estado = 'A'
      ORDER BY s.es_principal DESC, YEAR(a.fecha_compra) DESC
    ) AS srv
    ${whereClause}
  `;

  request.input("limit", limit).input("offset", offset);
  //console.log(whereClause); ORDER BY t.apellidos ASC
  const [result, countResult, statsResult, tecnicosResult] = await Promise.all([
    request.query(`
      SELECT
        f.*,
        t.apellidos + ' ' + t.nombres AS nombre_tecnico,
        srv.codigo_activo AS codigo_servidor,
        YEAR(srv.fecha_compra)    AS ano_servidor,
        srv.so_servidor,
        srv.tipo_ram,
        srv.ram,
        srv.virtualizer
      ${baseQuery}
      ${orderBy}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `),
    requestCount.query(`SELECT COUNT(*) AS total ${baseQuery}`),
    requestStats.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN f.tipo_farmacia = 'Propia' THEN 1 ELSE 0 END) AS propias,
        SUM(CASE WHEN f.tipo_farmacia = 'Franquicia' THEN 1 ELSE 0 END) AS franquicias
        ${baseQuery}`),
    requestTecnicos.query(
      `SELECT
        ISNULL(t.apellidos + ' ' + t.nombres, 'Sin asignar') AS tecnico,
        COUNT(*) AS total
        ${baseQuery}
      GROUP BY
        ISNULL(t.apellidos + ' ' + t.nombres, 'Sin asignar')
      ORDER BY tecnico`
    )
  ]);

  return {
    data: result.recordset,
    total: countResult.recordset[0].total,
    stats: statsResult.recordset[0],
    conteoTecnicos: tecnicosResult.recordset,
  };
};

export const actualizarFarmacia = async (data: Pick<Farmacia, "oficina" | "so_servidor" | "tecnologia_terminales" | "ssoo_terminales" | "num_puntos_venta" | "tipo_rack" | "estado">) => {
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

export const obtenerFarmaciasListado = async (
  rol: string,
  cedula: string,
) => {
  const pool = await getConnection();
  const request = pool.request();

  let whereClause = "WHERE f.estado = 'A'";

  if (rol === "TECNICO") {
    request.input("cedula_sesion", cedula);
    whereClause += " AND f.cedula_tecnico = @cedula_sesion";
  }

  const result = await request.query(`
    SELECT
      f.oficina,
      f.nombre,
      f.tipo_farmacia
    FROM farmacia f
    ${whereClause}
    ORDER BY f.nombre ASC
  `);

  return result.recordset;
};

export const obtenerFarmaciasParaExportar = async () => {
  const pool = await getConnection();
  const request = pool.request();

  /* const orderBy = filtros.tecnico
    ? "ORDER BY f.nombre ASC"
    : "ORDER BY t.apellidos ASC, t.nombres ASC";

  let whereClause = "";
  if (rol === "TECNICO") {
    request.input("cedula_sesion", cedula);
    whereClause += " WHERE f.cedula_tecnico = @cedula_sesion";
  }
  if (filtros.search) {
    request.input("search", `%${filtros.search}%`);
    whereClause += whereClause ? " AND" : " WHERE";
    whereClause += ` (f.nombre LIKE @search OR f.oficina LIKE @search OR t.apellidos + ' ' + t.nombres LIKE @search OR f.marca LIKE @search)`;
  }
  if (filtros.estado) {
    request.input("estado", filtros.estado);
    whereClause += whereClause ? " AND" : " WHERE";
    whereClause += " f.estado = @estado";
  }
  if (filtros.tecnico) {
    request.input("tecnico", filtros.tecnico);
    whereClause += whereClause ? " AND" : " WHERE";
    whereClause += " t.apellidos + ' ' + t.nombres = @tecnico";
  } */

  const result = await request.query(`
    SELECT
      f.oficina,
      f.nombre,
      t.apellidos + ' ' + t.nombres AS nombre_tecnico,
      f.tipo_farmacia,
      f.marca,
      srv.codigo_activo,
      YEAR(srv.fecha_compra) AS ano_compra,
      srv.so_servidor,
      srv.tipo_ram,
      srv.ram,
      f.tecnologia_terminales,
      f.ssoo_terminales,
      srv.virtualizer,
      f.num_puntos_venta,
      f.tipo_rack
    FROM farmacia f
    LEFT JOIN tecnicos t ON t.cedula = f.cedula_tecnico
    OUTER APPLY (
      SELECT TOP 1
        a.codigo_activo,
        a.fecha_compra,
        s.so_servidor,
        s.tipo_ram,
        s.ram,
        s.virtualizer
      FROM activo a
      INNER JOIN servidor s ON s.codigo_activo = a.codigo_activo
      WHERE a.oficina = f.oficina
        AND a.nombre_activo = 'CPU'
        AND a.estado = 'A'
      ORDER BY s.es_principal DESC, a.fecha_compra DESC
    ) AS srv
     WHERE f.estado = 'A'
     ORDER BY t.apellidos ASC, t.nombres ASC
  `);

  return result.recordset;
};