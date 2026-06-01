import { getConnection } from "@/lib/db";
export const obtenerFiltrosActivos = async (rol: string, cedula: string) => {
  const pool = await getConnection();
  const whereExtra = rol === "TECNICO" ? `AND t.cedula = '${cedula}'` : "";

  const [filtrosResult, countResult, farmaciaResult] = await Promise.all([
    pool.request().query(`
    SELECT DISTINCT
      f.marca                              AS marca,
      t.apellidos + ' ' + t.nombres       AS nombre_tecnico
    FROM activo a
    INNER JOIN farmacia f ON f.oficina    = a.oficina
    LEFT JOIN tecnicos t  ON t.cedula     = f.cedula_tecnico
    WHERE a.estado = 'A' ${whereExtra}
    ORDER BY nombre_tecnico, marca
  `),
    pool.request().query(`
      SELECT a.nombre_activo, COUNT(*) AS total
      FROM activo a
      INNER JOIN farmacia f ON f.oficina = a.oficina
      LEFT JOIN tecnicos t ON t.cedula = f.cedula_tecnico
      WHERE a.estado = 'A' ${whereExtra}
      GROUP BY a.nombre_activo
    `),
    pool.request().query(`
      SELECT DISTINCT f.nombre AS nombre_farmacia
      FROM activo a
      INNER JOIN farmacia f ON f.oficina = a.oficina
      LEFT JOIN tecnicos t ON t.cedula = f.cedula_tecnico
      WHERE a.estado = 'A' ${whereExtra}
      ORDER BY f.nombre
      `)

  ]);

  const marcas = [...new Set(filtrosResult.recordset.map((r: any) => r.marca).filter(Boolean))];
  const tecnicos = [...new Set(filtrosResult.recordset.map((r: any) => r.nombre_tecnico).filter(Boolean))];

  const farmacias = farmaciaResult.recordset.map((r: any) => r.nombre_farmacia).filter(Boolean).sort();
  return { marcas, tecnicos, farmacias, conteoTipos: countResult.recordset, };
};