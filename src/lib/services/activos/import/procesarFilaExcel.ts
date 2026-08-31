import { ACTIVOS_PERMITIDOS, extraerCodigoAnterior, extraerAnoCompra, extraerFechaCompra } from "@/lib/helpers/excelHelpers";
import type { ProcesarFilaParams } from "@/app/types/activo"
import { procesarServidor } from "./procesarServidor";
import { procesarCambioCodigo } from "./procesarCambioCodigo";
import { procesarCC } from "./procesarCC";
import { actualizarActivoExistente } from "./actualizarActivoExistente";
import { insertarActivoNuevo } from "./insertarActivoNuevo";

export const procesarFilaExcel = async ({
    pool,
    row,
    farmacias,
    activosEnBD,
    codigosEnExcel,
    farmaciasPorCentroCosto,
    resumen
}: ProcesarFilaParams) => {

    const codigoActivo = row["Activo fijo"]?.toString().trim();
    const nombreActivo = row["Nombre Activo"]?.toString().trim().toUpperCase();
    const centroCosto = row["Centro de coste"]?.toString().trim();
    const centroCostoOrigen = row["Centro Costo Origen"]?.toString().trim().toUpperCase();
    const fechaAlta = row["Fecha de Alta"];
    const detalle = row["Detalle"]?.toString().trim() ?? null;
    const nombreCustodio = row["Nombre Custodio"]?.toString().trim() ?? null;

    if (!codigoActivo || !nombreActivo || !centroCosto) return;

    codigosEnExcel.add(codigoActivo);

    // ── DETECCIÓN CAMBIO 14→18 ──────────────────────────────
    await procesarCambioCodigo({
        pool,
        codigoActivo,
        detalle,
        activosEnBD,
        codigosEnExcel,
    });

    if (!ACTIVOS_PERMITIDOS.has(nombreActivo)) return;

    /*     const anoCompra = fechaAlta instanceof Date
            ? fechaAlta.getFullYear()
            : fechaAlta ? new Date(fechaAlta).getFullYear() : null; */
    const fechaCompra = extraerFechaCompra(fechaAlta);
    //const farmacia = farmacias.find((f: any) => f.nombre.toUpperCase() === centroCostoOrigen);
    const farmacia = farmaciasPorCentroCosto.get(centroCosto);
    const esContactCenter = centroCosto === "1102901600";

    if (esContactCenter) {
        await procesarCC({
            pool,
            codigoActivo,
            nombreActivo,
            fechaCompra,
            detalle,
            nombreCustodio,
            activosEnBD,
            resumen,
        });
        return;
    }
    if (!farmacia) {
        resumen.sin_farmacia.push(
            `${codigoActivo} - ${centroCostoOrigen}`
        );
        return;
    };
    const esFranquicia = farmacia.tipo_farmacia === "Franquicia";
    const activoEnBD = activosEnBD.get(codigoActivo);
    const yaExiste = !!activoEnBD;

    if (esFranquicia && !yaExiste) {
        resumen.franquicia_omitidos++;
        return;
    }
    if (yaExiste) {
        await actualizarActivoExistente({
            pool,
            codigoActivo,
            nombreActivo,
            fechaCompra,
            detalle,
            farmacia,
            activoEnBD,
            nombreCustodio,
            farmaciasPorCentroCosto,
            resumen,
        });
    } else {
        await insertarActivoNuevo({
            pool,
            codigoActivo,
            nombreActivo,
            fechaCompra,
            detalle,
            farmacia,
            activosEnBD,
            nombreCustodio,
            resumen,
        });
    }

    await procesarServidor({
        pool,
        codigo_activo: codigoActivo,
        nombre_activo: nombreActivo,
        descripcion: detalle,
        oficina: farmacia.oficina
    });

}