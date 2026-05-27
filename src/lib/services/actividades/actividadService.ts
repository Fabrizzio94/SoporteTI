import { getConnection } from "@/lib/db";
import { Actividad } from "@/app/types/actividad";
type FiltrosActividades = {
  rol: string;
  cedula: string;
  busqueda: string;
  farmacia: string;
  tecnico: string;
  estado: string;
  desde: string;
  hasta: string;
};

export const obtenerActividades = async (filtros: FiltrosActividades) => {
  const pool = await getConnection();
  const request = pool.request();
  const requestResumen = pool.request();

  const conditions: string[] = [];
  const conditionsResumen: string[] = [];
  // -- ROL / TECNICO ---
  if (filtros.rol === "TECNICO") {
    request.input("cedula", filtros.cedula);
    conditions.push("h.cedula_tecnico = @cedula");

    requestResumen.input("cedulaResumen", filtros.cedula);
    conditionsResumen.push("cedula_tecnico = @cedulaResumen");
  } else if (filtros.tecnico) {
    request.input("tecnico", filtros.tecnico);
    conditions.push("h.cedula_tecnico = @tecnico");
  }
  // -- busqueda amplia por codigo, tecnico, farmacia
  if (filtros.busqueda) {
    request.input("busqueda", `%${filtros.busqueda}%`);
    conditions.push(`(
          h.codigo_activo LIKE @busqueda OR
          h.nombre_tecnico LIKE @busqueda OR
          f.nombre LIKE @busqueda OR
          h.cedula_tecnico LIKE @busqueda
        )`);
  }
  // farmacia
  if (filtros.farmacia) {
    request.input("farmacia", `%${filtros.farmacia}%`);
    conditions.push("(h.oficina LIKE @farmacia OR f.nombre LIKE @farmacia)");
  }
  // fechas
  if (filtros.desde) {
    request.input("desde", filtros.desde);
    conditions.push("h.fecha_baja >= @desde");
  }
  if (filtros.hasta) {
    request.input("hasta", `${filtros.hasta} 23:59:59`);
    conditions.push("h.fecha_baja <= @hasta");
  }
  // estado
  switch (filtros.estado) {
    case "Verificado":
      conditions.push("h.verificado = 1 AND h.tipo_baja = 'MANUAL'");
      break;
    case "Pendiente":
      conditions.push("h.verificado = 0 AND h.tipo_baja = 'MANUAL'");
      break;
    case "Automatico":
      conditions.push("h.tipo_baja = 'Automatico'");
      break;
    case "Reactivado":
      conditions.push("h.motivo_baja LIKE '%Reactivado%'");
      break;
  }
  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  const whereResumen = conditionsResumen.length
    ? "WHERE " + conditionsResumen.join(" AND ")
    : "";

  const result = await request.query(`
        SELECT
            h.*,
            f.tipo_farmacia,
            f.nombre AS nombre_farmacia
        FROM historico_activo h
        LEFT JOIN farmacia f ON f.oficina = h.oficina
        ${whereClause}
        ORDER BY h.fecha_baja DESC
    `);

  const resumenResult = await requestResumen.query(`
        SELECT
            COUNT(*)                                                        AS total,
            SUM(CASE WHEN tipo_baja = 'MANUAL'                    THEN 1 ELSE 0 END) AS manuales,
            SUM(CASE WHEN tipo_baja = 'Automatico'                THEN 1 ELSE 0 END) AS automaticos,
            SUM(CASE WHEN verificado = 1                          THEN 1 ELSE 0 END) AS verificados,
            SUM(CASE WHEN tipo_baja = 'MANUAL' AND verificado = 0 THEN 1 ELSE 0 END) AS pendientes
        FROM historico_activo
        ${whereResumen}
    `);

  return {
    actividades: result.recordset,
    resumen: resumenResult.recordset[0],
  };
};

export const editarActividad = async (data: {
  id: number;
  motivo_baja?: string;
  observacion?: string | null;
  codigo_reemplazo?: string | null;
}) => {
  const pool = await getConnection();

  const histResult = await pool.request()
    .input("id", data.id)
    .query(`SELECT * FROM historico_activo WHERE id = @id`);

  const hist = histResult.recordset[0];
  if (!hist) return null;

  await pool.request()
    .input("id", data.id)
    .input("motivo_baja", data.motivo_baja ?? hist.motivo_baja)
    .input("observacion", data.observacion ?? hist.observacion)
    .input("codigo_reemplazo", data.codigo_reemplazo ?? hist.codigo_reemplazo)
    .query(`
      UPDATE historico_activo SET
        motivo_baja      = @motivo_baja,
        observacion      = @observacion,
        codigo_reemplazo = @codigo_reemplazo
      WHERE id = @id
    `);

  return { ok: true, accion: "editado" };
};

export const reactivarActividad = async (data: {
  id: number;
  observacion?: string | null;
  nueva_oficina?: string | null;
}) => {
  const pool = await getConnection();

  const histResult = await pool.request()
    .input("id", data.id)
    .query(`SELECT * FROM historico_activo WHERE id = @id`);

  const hist = histResult.recordset[0];
  if (!hist) return null;

  await pool.request()
    .input("codigo_activo", hist.codigo_activo)
    .input("oficina", data.nueva_oficina ?? hist.oficina)
    .query(`
      UPDATE activo SET estado = 'A', oficina = @oficina
      WHERE codigo_activo = @codigo_activo
    `);

  await pool.request()
    .input("codigo_activo", hist.codigo_activo)
    .input("nombre_activo", hist.nombre_activo)
    .input("oficina", data.nueva_oficina ?? hist.oficina)
    .input("cedula_tecnico", hist.cedula_tecnico ?? null)
    .input("nombre_tecnico", hist.nombre_tecnico ?? null)
    .input("ano_compra", hist.ano_compra ?? null)
    .input("motivo_baja", data.nueva_oficina ? "Reasignado a otra farmacia" : "Reactivado")
    .input("observacion", data.observacion ?? null)
    .input("tipo_baja", "MANUAL")
    .input("verificado", 1)
    .input("fecha_verificacion", new Date())
    .query(`
      INSERT INTO historico_activo (
        codigo_activo, nombre_activo, oficina, cedula_tecnico,
        nombre_tecnico, ano_compra, motivo_baja, observacion,
        tipo_baja, verificado, fecha_verificacion
      ) VALUES (
        @codigo_activo, @nombre_activo, @oficina, @cedula_tecnico,
        @nombre_tecnico, @ano_compra, @motivo_baja, @observacion,
        @tipo_baja, @verificado, @fecha_verificacion
      )
    `);

  return { ok: true, accion: "reactivado" };
};