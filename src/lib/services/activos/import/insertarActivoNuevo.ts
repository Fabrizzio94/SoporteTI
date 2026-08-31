import type { InsertarActivoNuevoParams } from "@/app/types/activo";

export const insertarActivoNuevo = async ({
    pool,
    codigoActivo,
    nombreActivo,
    fechaCompra,
    detalle,
    farmacia,
    activosEnBD,
    nombreCustodio,
    resumen,
}: InsertarActivoNuevoParams) => {
    await pool.request()
        .input("codigo_activo", codigoActivo)
        .input("nombre_activo", nombreActivo)
        .input("fecha_compra", fechaCompra)
        .input("descripcion", detalle)
        .input("oficina", farmacia.oficina)
        .input("cedula_tecnico", farmacia.cedula_tecnico ?? null)
        .input("nombre_custodio", nombreCustodio)
        .input("centro_costo", farmacia.centro_costo)
        .query(`
          INSERT INTO activo (codigo_activo, nombre_activo, fecha_compra, descripcion, estado, oficina, cedula_tecnico,nombre_custodio, control_importacion,centro_costo)
          VALUES (@codigo_activo, @nombre_activo, @fecha_compra, @descripcion, 'A', @oficina, @cedula_tecnico, @nombre_custodio,1, @centro_costo)
        `);
    resumen.insertados++;
    activosEnBD.set(codigoActivo, {
        codigo_activo: codigoActivo,
        estado: "A",
        nombre_activo: nombreActivo,
        oficina: farmacia.oficina,
        cedula_tecnico: farmacia.cedula_tecnico ?? null,
        fecha_compra: fechaCompra,
        control_importacion: 1,
        tipo_farmacia: farmacia.tipo_farmacia,
        nombre_tecnico: null,
        centro_costo: farmacia.centro_costo,
    });
}