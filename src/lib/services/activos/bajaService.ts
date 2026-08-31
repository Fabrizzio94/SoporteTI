import { TipoBaja } from "@/app/types/actividad";
import { getConnection } from "@/lib/db";

export const procesarBajaActivo = async (
  codigo_activo: string,
  motivo_baja: string,
  cedula_tecnico: string,
  observacion?: string | null,
  codigo_reemplazo?: string | null
) => {
  const pool = await getConnection();

  // Obtener datos del activo
  const activoResult = await pool.request()
    .input("codigo_activo", codigo_activo)
    .query(`
      SELECT a.*, f.tipo_farmacia
      FROM activo a
      INNER JOIN farmacia f ON f.oficina = a.oficina
      WHERE a.codigo_activo = @codigo_activo
    `);

  const activo = activoResult.recordset[0];
  if (!activo) return null; // el route maneja el 404

  // Obtener nombre completo del técnico desde sesión
  const tecnicoResult = await pool.request()
    .input("cedula", cedula_tecnico)
    .query(`
      SELECT apellidos + ' ' + nombres AS nombre_completo
      FROM tecnicos WHERE cedula = @cedula
    `);
  const nombreTecnico = tecnicoResult.recordset[0]?.nombre_completo ?? "Sin Técnico";

  const esFranquicia = activo.tipo_farmacia === "Franquicia";

  // Dar de baja
  await pool.request()
    .input("codigo_activo", codigo_activo)
    .query(`UPDATE activo SET estado = 'I' WHERE codigo_activo = @codigo_activo`);

  // Registrar en histórico
  await pool.request()
    .input("codigo_activo", codigo_activo)
    .input("nombre_activo", activo.nombre_activo)
    .input("oficina", activo.oficina)
    .input("cedula_tecnico", activo.cedula_tecnico ?? null)
    .input("motivo_baja", motivo_baja)
    .input("observacion", observacion ?? null)
    .input("fecha_compra", activo.fecha_compra ?? null)
    .input("codigo_reemplazo", codigo_reemplazo ?? null)
    .input("nombre_tecnico", nombreTecnico)
    .input("tipo_baja", TipoBaja.MANUAL)
    .input("verificado", esFranquicia ? 1 : 0)
    .input("fecha_verificacion", esFranquicia ? new Date() : null)
    .query(`
      INSERT INTO historico_activo (
        codigo_activo, nombre_activo, oficina, cedula_tecnico,
        motivo_baja, observacion, fecha_compra, codigo_reemplazo,
        nombre_tecnico, tipo_baja, verificado, fecha_verificacion
      ) VALUES (
        @codigo_activo, @nombre_activo, @oficina, @cedula_tecnico,
        @motivo_baja, @observacion, @fecha_compra, @codigo_reemplazo,
        @nombre_tecnico, @tipo_baja, @verificado, @fecha_verificacion
      )
    `);

  return { ok: true };
};