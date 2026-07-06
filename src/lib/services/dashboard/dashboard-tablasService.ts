import { getConnection } from "@/lib/db";


export const obtenerDatosTablaDashboard = async (rol: string, cedula: string) => {
  const pool = await getConnection();
  const whereExtra = rol === "TECNICO" ? `AND f.cedula_tecnico ='${cedula}'` : "";
  const query = (campo: string, tabla: string = "farmacia", join: string = "") => `
    SELECT 
      COALESCE(${campo}, 'Sin datos') AS nombre,
      SUM(CASE WHEN f.tipo_farmacia = 'Propia'     THEN 1 ELSE 0 END) AS propias,
      SUM(CASE WHEN f.tipo_farmacia = 'Franquicia' THEN 1 ELSE 0 END) AS franquicias,
      SUM(CASE WHEN f.tipo_farmacia IS NULL         THEN 1 ELSE 0 END) AS sin_tipo,
      COUNT(*) AS total
    FROM ${tabla} f ${join}
    WHERE f.estado = 'A' ${whereExtra}
    GROUP BY ${campo}
    ORDER BY total DESC
  `;

  const [tecnologia, marcas, soTerminales, soServidor, ram, puntosVenta, anoCompraServidor] = await Promise.all([
    pool.request().query(query("f.tecnologia_terminales")),
    pool.request().query(query("f.marca")),
    pool.request().query(query("f.ssoo_terminales")),
    pool.request().query(`
      SELECT
        COALESCE(s.so_servidor, 'Sin datos') AS nombre,
        SUM(CASE WHEN f.tipo_farmacia = 'Propia'     THEN 1 ELSE 0 END) AS propias,
        SUM(CASE WHEN f.tipo_farmacia = 'Franquicia' THEN 1 ELSE 0 END) AS franquicias,
        SUM(CASE WHEN f.tipo_farmacia IS NULL         THEN 1 ELSE 0 END) AS sin_tipo,
        COUNT(*) AS total
      FROM servidor s
      INNER JOIN activo  a ON a.codigo_activo = s.codigo_activo
      INNER JOIN farmacia f ON f.oficina      = a.oficina
      WHERE 1=1 
      AND a.estado = 'A' 
      AND s.es_principal = 1
      ${whereExtra}
      GROUP BY s.so_servidor
      ORDER BY total DESC
    `),
    pool.request().query(`
      SELECT
        COALESCE(CAST(s.ram AS VARCHAR), 'Sin datos') AS nombre,
        SUM(CASE WHEN f.tipo_farmacia = 'Propia'     THEN 1 ELSE 0 END) AS propias,
        SUM(CASE WHEN f.tipo_farmacia = 'Franquicia' THEN 1 ELSE 0 END) AS franquicias,
        SUM(CASE WHEN f.tipo_farmacia IS NULL         THEN 1 ELSE 0 END) AS sin_tipo,
        COUNT(*) AS total
      FROM servidor s
      INNER JOIN activo  a ON a.codigo_activo = s.codigo_activo
      INNER JOIN farmacia f ON f.oficina      = a.oficina
      WHERE 1=1 
      AND a.estado = 'A' 
      AND s.es_principal = 1 
      ${whereExtra}
      GROUP BY s.ram
      ORDER BY total DESC
    `),
    // puntosVenta — suma de num_puntos_venta por tecnología con desglose
    pool.request().query(`
      SELECT
        COALESCE(tecnologia_terminales, 'Sin datos') AS nombre,
        SUM(CASE WHEN tipo_farmacia = 'Propia'     THEN COALESCE(num_puntos_venta, 0) ELSE 0 END) AS propias,
        SUM(CASE WHEN tipo_farmacia = 'Franquicia' THEN COALESCE(num_puntos_venta, 0) ELSE 0 END) AS franquicias,
        SUM(CASE WHEN tipo_farmacia IS NULL         THEN COALESCE(num_puntos_venta, 0) ELSE 0 END) AS sin_tipo,
        SUM(COALESCE(num_puntos_venta, 0)) AS total
      FROM farmacia f
      WHERE f.estado = 'A' ${whereExtra}
      GROUP BY tecnologia_terminales
      ORDER BY total DESC
    `),

    // anoCompraServidor — agrupado por año ascendente
    pool.request().query(`
      SELECT
        COALESCE(CAST(a.ano_compra AS VARCHAR), 'Sin datos') AS nombre,
        SUM(CASE WHEN f.tipo_farmacia = 'Propia'     THEN 1 ELSE 0 END) AS propias,
        SUM(CASE WHEN f.tipo_farmacia = 'Franquicia' THEN 1 ELSE 0 END) AS franquicias,
        SUM(CASE WHEN f.tipo_farmacia IS NULL         THEN 1 ELSE 0 END) AS sin_tipo,
        COUNT(*) AS total
      FROM servidor s
      INNER JOIN activo  a ON a.codigo_activo = s.codigo_activo
      INNER JOIN farmacia f ON f.oficina      = a.oficina
      WHERE 1=1 
      AND a.estado = 'A' 
      AND s.es_principal = 1
      ${whereExtra}
      GROUP BY a.ano_compra
      ORDER BY a.ano_compra ASC
    `),
  ]);

  return {
    tecnologia: tecnologia.recordset,
    marcas: marcas.recordset,
    soTerminales: soTerminales.recordset,
    soServidor: soServidor.recordset,
    ram: ram.recordset,
    puntosVenta: puntosVenta.recordset,
    anoCompraServidor: anoCompraServidor.recordset,
  };
};