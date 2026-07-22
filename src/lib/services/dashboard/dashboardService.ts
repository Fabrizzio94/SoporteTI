import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
export const obtenerDatosDashboard = async (rol: string, cedula: string) => {
  const pool = await getConnection();
  const whereExtra = rol === "TECNICO" ? `AND f.cedula_tecnico ='${cedula}'` : "";
  /* if (rol === "TECNICO") {
  request.input("cedula", cedula);
  conditions.push("f.cedula_tecnico = @cedula");
  } */
  const [
    tipoFarmacia,
    marcas,
    tecnologia,
    soTerminales,
    soServidor,
    ram,
    virtualizador,
    num_puntos_venta,
    puntosVentaAgrupado
    //puntosVentaxTecnologia
  ] = await Promise.all([
    pool.request().query(`
      SELECT COALESCE(tipo_farmacia, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia f WHERE f.estado = 'A' ${whereExtra}
      GROUP BY tipo_farmacia
    `),
    pool.request().query(`
      SELECT COALESCE(marca, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia f WHERE f.estado = 'A' ${whereExtra}
      GROUP BY marca ORDER BY total DESC
    `),
    pool.request().query(`
      SELECT COALESCE(tecnologia_terminales, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia f WHERE f.estado = 'A' ${whereExtra}
      GROUP BY tecnologia_terminales
      ORDER BY total DESC
    `),
    /* ORDER BY
  CASE tecnologia_terminales
    WHEN 'AMD-2' THEN 1
    WHEN 'AMD-3' THEN 2
    WHEN 'AMD-4' THEN 3
    WHEN 'AMD-5' THEN 4
    ELSE 99
  END */
    pool.request().query(`
      SELECT COALESCE(ssoo_terminales, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia f WHERE f.estado = 'A' ${whereExtra}
      GROUP BY ssoo_terminales
    `),
    pool.request().query(`
      SELECT COALESCE(so_servidor, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM servidor s
      INNER JOIN activo a ON a.codigo_activo = s.codigo_activo
      INNER JOIN farmacia f ON f.oficina = a.oficina
      WHERE f.estado = 'A'
      AND a.estado = 'A' 
      AND s.es_principal = 1
      ${whereExtra}
      GROUP BY s.so_servidor
    `),
    pool.request().query(`
      SELECT COALESCE(CAST(ram AS VARCHAR), 'Sin datos') AS nombre, COUNT(*) AS total
      FROM servidor s
      INNER JOIN activo a ON a.codigo_activo = s.codigo_activo
      INNER JOIN farmacia f ON f.oficina = a.oficina
      WHERE f.estado = 'A' 
      AND a.estado = 'A' 
      AND s.es_principal = 1
      ${whereExtra}
      GROUP BY s.ram
    `),
    pool.request().query(`
      SELECT COALESCE(virtualizer, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM servidor s
      INNER JOIN activo a ON a.codigo_activo = s.codigo_activo
      INNER JOIN farmacia f ON f.oficina = a.oficina
      WHERE f.estado ='A'
      AND a.estado = 'A'
      AND s.es_principal = 1
      ${whereExtra}
      GROUP BY s.virtualizer
    `),
    pool.request().query(`
      SELECT
        COALESCE(tecnologia_terminales, 'Sin datos') AS nombre,
        SUM(COALESCE(num_puntos_venta, 0)) AS total
      FROM farmacia f
      WHERE f.estado = 'A' ${whereExtra}
      GROUP BY tecnologia_terminales
      HAVING SUM(COALESCE(num_puntos_venta, 0)) > 0  -- ← excluye los que suman 0
      ORDER BY total DESC
      `),
    pool.request().query(`
          SELECT
            COALESCE(tecnologia_terminales, 'Sin datos') AS nombre,
            SUM(CASE WHEN tipo_farmacia = 'Propia'     THEN 1 ELSE 0 END) AS propias,
            SUM(CASE WHEN tipo_farmacia = 'Franquicia' THEN 1 ELSE 0 END) AS franquicias
          FROM farmacia f
          WHERE f.estado = 'A' ${whereExtra}
          GROUP BY tecnologia_terminales
          ORDER BY COUNT(*) DESC
      `),
    /* numero de pdv por tecnologia
      pool.request().query(`
          SELECT
            COALESCE(tecnologia_terminales, 'Sin datos') AS nombre,
            SUM(CASE WHEN tipo_farmacia = 'Propia'     THEN COALESCE(num_puntos_venta, 0) ELSE 0 END) AS propias,
            SUM(CASE WHEN tipo_farmacia = 'Franquicia' THEN COALESCE(num_puntos_venta, 0) ELSE 0 END) AS franquicias
          FROM farmacia f
          WHERE f.estado = 'A' ${whereExtra}
          GROUP BY tecnologia_terminales
          ORDER BY 
            SUM(CASE WHEN tipo_farmacia = 'Propia'     THEN COALESCE(num_puntos_venta, 0) ELSE 0 END) +
            SUM(CASE WHEN tipo_farmacia = 'Franquicia' THEN COALESCE(num_puntos_venta, 0) ELSE 0 END) DESC
    `), */
  ]);

  const totalFarmacias = tipoFarmacia.recordset.reduce((acc: number, r: any) => acc + r.total, 0);
  const totalServidores = soServidor.recordset.reduce((acc: number, r: any) => acc + r.total, 0);
  const propias = tipoFarmacia.recordset.find((r: any) => r.nombre === "Propia")?.total ?? 0;
  const franquicias = tipoFarmacia.recordset.find((r: any) => r.nombre == "Franquicia")?.total ?? 0;
  //console.log("dashboard data:", JSON.stringify(num_puntos_venta.recordset));
  return {
    resumen: { totalFarmacias, totalServidores, propias, franquicias },
    tipoFarmacia: tipoFarmacia.recordset,
    marcas: marcas.recordset,
    tecnologia: tecnologia.recordset,
    soTerminales: soTerminales.recordset,
    soServidor: soServidor.recordset,
    ram: ram.recordset,
    virtualizador: virtualizador.recordset,
    num_puntos_venta: num_puntos_venta.recordset,
    puntosVentaAgrupado: puntosVentaAgrupado.recordset,
    // puntosVentaxTecnologia: puntosVentaxTecnologia.recordset,
  };
};