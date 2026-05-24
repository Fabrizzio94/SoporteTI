import { getConnection, getMatrizConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export const procesarSync = async () => {
  const poolMatriz = await getMatrizConnection();
  const poolLocal = await getConnection();
  const mssql = require('mssql');
  /* const resultMatriz = await poolMatriz.request().query(`
    SELECT 
      OFI.OFICINA   AS OFICINA,
      OFI.NOMBRE    AS FARMACIA,
      AT.tec_cedula AS CEDULA_TECNICO,
      CONCAT(AT.tec_apellido, ' ', AT.tec_nombre) AS TECNICO,
      AT.tec_nombre   AS NOMBRES,
      AT.tec_apellido AS APELLIDOS,
      SU.NOMBRE       AS SUCURSAL,
      OFI.ES_FRANQUICIA AS FRANQUICIA,
      US.NombreCorto  AS USUARIO,
      US.password AS PASSWORD
    FROM DBO.OFICINA AS OFI WITH(NOLOCK)
    INNER JOIN [dbo].[SP_PAR_AsignacionFarmacias] AS AF ON OFI.Oficina = AF.af_idoficina
    INNER JOIN [dbo].[SP_PAR_Tecnicos] AS AT ON AF.af_cedula = AT.tec_cedula
    INNER JOIN COMISIONES.BDGENERAL.DBO.SUCURSALES AS SU 
      ON SU.CODIGO_SUCURSAL COLLATE SQL_Latin1_General_CP1_CI_AS = OFI.SUCURSAL COLLATE SQL_Latin1_General_CP1_CI_AS
    INNER JOIN 
    COMISIONES.BDGENERAL.DBO.OFICINA_IP_SERVER AS OIP 
    ON OFI.Oficina COLLATE SQL_Latin1_General_CP1_CI_AS = OIP.oficina COLLATE SQL_Latin1_General_CP1_CI_AS
    LEFT JOIN EasySeguridad.dbo.usuarios AS US ON US.cedula = AT.tec_cedula
    WHERE OFI.ESTADO = 'A'
  `);  */
  const resultMatriz = await poolMatriz.request().query(
  `SELECT 
      OFI.OFICINA   AS OFICINA,
      OFI.NOMBRE    AS FARMACIA,
      AT.tec_cedula AS CEDULA_TECNICO,
      CONCAT(AT.tec_apellido, ' ', AT.tec_nombre) AS TECNICO,
      AT.tec_nombre   AS NOMBRES,
      AT.tec_apellido AS APELLIDOS,
      SU.NOMBRE       AS SUCURSAL,
      OFI.ES_FRANQUICIA AS FRANQUICIA,
      US.NombreCorto  AS USUARIO,
      US.password AS PASSWORD
  FROM DBO.OFICINA AS OFI WITH(NOLOCK)
  INNER JOIN [dbo].[SP_PAR_AsignacionFarmacias] AS AF ON OFI.Oficina = AF.af_idoficina
  INNER JOIN [dbo].[SP_PAR_Tecnicos] AS AT ON AF.af_cedula = AT.tec_cedula
  INNER JOIN COMISIONES.BDGENERAL.DBO.SUCURSALES AS SU 
    ON SU.CODIGO_SUCURSAL COLLATE SQL_Latin1_General_CP1_CI_AS = OFI.SUCURSAL COLLATE SQL_Latin1_General_CP1_CI_AS
  INNER JOIN COMISIONES.BDGENERAL.DBO.OFICINA_IP_SERVER AS OIP 
    ON OFI.Oficina COLLATE SQL_Latin1_General_CP1_CI_AS = OIP.oficina COLLATE SQL_Latin1_General_CP1_CI_AS
  LEFT JOIN EasySeguridad.dbo.usuarios AS US ON US.cedula = AT.tec_cedula
  WHERE OFI.ESTADO = 'A'

  UNION ALL

  SELECT 
      '9999'                    AS OFICINA,
      'ADMINISTRACION SISTEMA'  AS FARMACIA,
      AT.tec_cedula             AS CEDULA_TECNICO,
      CONCAT(AT.tec_apellido, ' ', AT.tec_nombre) AS TECNICO,
      AT.tec_nombre             AS NOMBRES,
      AT.tec_apellido           AS APELLIDOS,
      'OFICINA CENTRAL'         AS SUCURSAL,
      'N'                       AS FRANQUICIA,
      US.NombreCorto            AS USUARIO,
      US.password               AS PASSWORD
  FROM [dbo].[SP_PAR_Tecnicos] AS AT
  INNER JOIN EasySeguridad.dbo.usuarios AS US ON US.cedula = AT.tec_cedula
  WHERE AT.tec_cedula = '1002166401'`
);
  const listaMatriz = resultMatriz.recordset;
  const tecnicosProcesados = new Set<string>();
    console.log('Total registros:', listaMatriz.length);
console.log('Primer registro completo:', JSON.stringify(listaMatriz[0]));
  for (const f of listaMatriz) {
    console.log('Procesando:', {
    OFICINA: f.OFICINA,
    OFICINA_TYPE: typeof f.OFICINA,
    CEDULA: f.CEDULA_TECNICO,
    CEDULA_TYPE: typeof f.CEDULA_TECNICO
  })
    // ── TÉCNICOS ─────────────────────────────────────────────
    try {
    if (f.CEDULA_TECNICO && !tecnicosProcesados.has(f.CEDULA_TECNICO)) {
      tecnicosProcesados.add(String(f.CEDULA_TECNICO));

      await poolLocal.request()
        .input("cedula", mssql.NVarChar(10), String(f.CEDULA_TECNICO))
        .input("nombres", f.NOMBRES)
        .input("apellidos", f.APELLIDOS)
        .input("usuario", f.USUARIO ?? null)
        .input("password", f.PASSWORD)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM tecnicos WHERE cedula = @cedula)
          BEGIN
            INSERT INTO tecnicos (cedula, nombres, apellidos, estado, rol, usuario, password)
            VALUES (@cedula, @nombres, @apellidos, 'A', 'TECNICO', @usuario, @password)
          END
          ELSE
          BEGIN
            UPDATE tecnicos
            SET usuario = @usuario, nombres = @nombres, apellidos = @apellidos, password = @password
            WHERE cedula = @cedula
          END
        `);
    }
    

    // ── FARMACIAS ─────────────────────────────────────────────
    if(f.OFICINA !== '9999') {
      await poolLocal.request()
        .input("oficina", mssql.NVarChar(20), String(f.OFICINA))
        .input("nombre", f.FARMACIA)
        .input("cedula_tecnico", mssql.NVarChar(20), String(f.CEDULA_TECNICO))
        .input("tipo", f.FRANQUICIA === "S" ? "Franquicia" : "Propia")
        .input("marca", f.SUCURSAL)
        .query(`
          MERGE INTO farmacia AS Destino
          USING (SELECT @oficina AS oficina) AS Origen
            ON Destino.oficina = Origen.oficina
          WHEN MATCHED THEN
            UPDATE SET
              nombre         = @nombre,
              cedula_tecnico = @cedula_tecnico,
              tipo_farmacia  = @tipo,
              estado         = 'A',
              fecha_sync     = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (oficina, nombre, cedula_tecnico, tipo_farmacia, marca, estado, fecha_sync)
            VALUES (@oficina, @nombre, @cedula_tecnico, @tipo, @marca, 'A', GETDATE());
        `);
        }
        }catch(err){
      console.error('ERROR en registro:', JSON.stringify(f));
    console.error('Detalle error:', err);
    throw err;
    }
  }
  // --- INACTIVAR TECNICOS que ya no vienen de matriz ---------
  //const cedulas = Array.from(tecnicosProcesados).join(",");
  const cedulas = Array.from(tecnicosProcesados).map(c => `'${c}'`).join(",");
  if (cedulas.length === 0) {
    return NextResponse.json({ error: "Sin datos de matriz, sync abortado" }, { status: 500 });
  }
  await poolLocal.request().query(`
      UPDATE tecnicos
      SET estado = 'I'
      WHERE cedula NOT IN (${cedulas})
      AND estado = 'A'
    `)
  // ── INACTIVAR farmacias que ya no vienen de matriz ────────
  const oficinasVivas = listaMatriz.map((f) => `'${f.OFICINA}'`).join(",");
  if (oficinasVivas.length > 0) {
    await poolLocal.request().query(`
      UPDATE farmacia SET estado = 'I'
      WHERE oficina NOT IN (${oficinasVivas})
    `);
  }

  return {
    ok: true,
    message: "Sincronización completada",
    count: listaMatriz.length,
  };
};