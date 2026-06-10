import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
export const obtenerDatosDashboard = async () => {
  const pool = await getConnection();

  const [tipoFarmacia, marcas, tecnologia, soTerminales, soServidor, ram, virtualizador, num_puntos_venta] = await Promise.all([
    pool.request().query(`
      SELECT COALESCE(tipo_farmacia, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia WHERE estado = 'A'
      GROUP BY tipo_farmacia
    `),
    pool.request().query(`
      SELECT COALESCE(marca, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia WHERE estado = 'A'
      GROUP BY marca ORDER BY total DESC
    `),
    pool.request().query(`
      SELECT COALESCE(tecnologia_terminales, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia WHERE estado = 'A'
      GROUP BY tecnologia_terminales
    `),
    pool.request().query(`
      SELECT COALESCE(ssoo_terminales, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM farmacia WHERE estado = 'A'
      GROUP BY ssoo_terminales
    `),
    pool.request().query(`
      SELECT COALESCE(so_servidor, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM servidor GROUP BY so_servidor
    `),
    pool.request().query(`
      SELECT COALESCE(CAST(ram AS VARCHAR), 'Sin datos') AS nombre, COUNT(*) AS total
      FROM servidor GROUP BY ram
    `),
    pool.request().query(`
      SELECT COALESCE(virtualizer, 'Sin datos') AS nombre, COUNT(*) AS total
      FROM servidor GROUP BY virtualizer
    `),
    pool.request().query(`
          SELECT
            COALESCE(tecnologia_terminales, 'Sin datos') AS nombre,
            SUM(COALESCE(num_puntos_venta,0)) AS total
          FROM farmacia WHERE estado = 'A'
          GROUP BY tecnologia_terminales
          ORDER BY total DESC
    `),
  ]);

  const totalFarmacias = tipoFarmacia.recordset.reduce((acc: number, r: any) => acc + r.total, 0);
  const totalServidores = soServidor.recordset.reduce((acc: number, r: any) => acc + r.total, 0);
  //console.log("dashboard data:", JSON.stringify(num_puntos_venta.recordset));
  return {
    resumen: { totalFarmacias, totalServidores },
    tipoFarmacia: tipoFarmacia.recordset,
    marcas: marcas.recordset,
    tecnologia: tecnologia.recordset,
    soTerminales: soTerminales.recordset,
    soServidor: soServidor.recordset,
    ram: ram.recordset,
    virtualizador: virtualizador.recordset,
    num_puntos_venta: num_puntos_venta.recordset,
  };
};