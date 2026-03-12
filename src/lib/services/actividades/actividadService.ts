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

    const filtroCedula =
        filtros.rol === "TECNICO"
            ? `AND h.cedula_tecnico = '${filtros.cedula}'`
            : filtros.tecnico ? `AND h.cedula_tecnico = '${filtros.tecnico}'` : "";

    const filtroBusqueda = filtros.busqueda ? `AND h.codigo_activo LIKE '%${filtros.busqueda}%'` : "";
    const filtroFarmacia = filtros.farmacia ? `AND h.oficina = '${filtros.farmacia}'` : "";
    const filtroDesde = filtros.desde ? `AND h.fecha_baja >= '${filtros.desde}'` : "";
    const filtroHasta = filtros.hasta ? `AND h.fecha_baja <= '${filtros.hasta} 23:59:59'` : "";

    const filtroEstado =
        filtros.estado === "Verificado" ? `AND h.verificado = 1 AND h.tipo_baja = 'MANUAL'` :
            filtros.estado === "Pendiente" ? `AND h.verificado = 0 AND h.tipo_baja = 'MANUAL'` :
                filtros.estado === "Automatico" ? `AND h.tipo_baja = 'Automatico'` :
                    filtros.estado === "Reactivado" ? `AND h.motivo_baja LIKE '%Reactivado%'` :
                        "";

    const result = await pool.request().query(`
    SELECT
      h.*,
      f.tipo_farmacia,
      f.nombre AS nombre_farmacia
    FROM historico_activo h
    LEFT JOIN farmacia f ON f.oficina = h.oficina
    WHERE 1=1
      ${filtroCedula}
      ${filtroBusqueda}
      ${filtroFarmacia}
      ${filtroEstado}
      ${filtroDesde}
      ${filtroHasta}
    ORDER BY h.fecha_baja DESC
  `);

    const resumenResult = await pool.request().query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN tipo_baja = 'MANUAL'                    THEN 1 ELSE 0 END) AS manuales,
      SUM(CASE WHEN tipo_baja = 'Automatico'                THEN 1 ELSE 0 END) AS automaticos,
      SUM(CASE WHEN verificado = 1                          THEN 1 ELSE 0 END) AS verificados,
      SUM(CASE WHEN tipo_baja = 'MANUAL' AND verificado = 0 THEN 1 ELSE 0 END) AS pendientes
    FROM historico_activo
    ${filtros.rol === "TECNICO" ? `WHERE cedula_tecnico = '${filtros.cedula}'` : ""}
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