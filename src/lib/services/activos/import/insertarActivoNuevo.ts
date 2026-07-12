import type { InsertarActivoNuevoParams } from "@/app/types/activo";

export const insertarActivoNuevo = async ({
    pool,
    codigoActivo,
    nombreActivo,
    anoCompra,
    detalle,
    farmacia,
    activosEnBD,
    nombreCustodio,
    resumen,
}: InsertarActivoNuevoParams) => {
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .input("nombre_activo", nombreActivo)
        .input("ano_compra", anoCompra)
        .input("descripcion", detalle)
        .input("oficina", farmacia.oficina)
        .input("cedula_tecnico", farmacia.cedula_tecnico ?? null)
        .input("nombre_custodio", nombreCustodio)
        .query(`
          INSERT INTO activo (codigo_activo, nombre_activo, ano_compra, descripcion, estado, oficina, cedula_tecnico,nombre_custodio)
          VALUES (@codigo_activo, @nombre_activo, @ano_compra, @descripcion, 'A', @oficina, @cedula_tecnico, @nombre_custodio)
        `);
    resumen.insertados++;
    activosEnBD.set(codigoActivo, {
        codigo_activo: codigoActivo,
        estado: "A",
        nombre_activo: nombreActivo,
        oficina: farmacia.oficina,
        cedula_tecnico: farmacia.cedula_tecnico ?? null,
        ano_compra: anoCompra,
        tipo_farmacia: farmacia.tipo_farmacia,
        nombre_tecnico: null,
    });
}