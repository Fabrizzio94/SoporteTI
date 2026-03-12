import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Tecnico } from "@/app/types/tecnico";
export const obtenerTecnicos = async () => {
    const pool = await getConnection();
    const result = await pool.request().query(`
    SELECT cedula, nombres, apellidos, estado, usuario, password, rol
    FROM tecnicos
    ORDER BY apellidos ASC
  `);
    return result.recordset.map((t) => ({
        ...t,
        nombreCompleto: `${t.apellidos} ${t.nombres}`,
    }));
};

export const crearTecnico = async (data: Pick<Tecnico,
    "cedula" | "nombres" | "apellidos" | "password" | "rol" | "usuario">) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(data.password!, salt);
    const pool = await getConnection();

    await pool.request()
        .input("cedula", data.cedula)
        .input("nombres", data.nombres)
        .input("apellidos", data.apellidos)
        .input("password", hashedPassword)
        .input("rol", data.rol || "TECNICO")
        .input("usuario", data.usuario)
        .query(`
      INSERT INTO tecnicos (cedula, nombres, apellidos, estado, password, rol, usuario)
      VALUES (@cedula, @nombres, @apellidos, 'A', @password, @rol, @usuario)
    `);

    return { ok: true };
};

export const actualizarTecnico = async (data: Pick<Tecnico,
    "cedula" | "nombres" | "apellidos" | "usuario" | "password" | "rol" | "estado">) => {
    const pool = await getConnection();

    let passwordFinal = null;
    if (data.password && data.password.trim() !== "") {
        const salt = bcrypt.genSaltSync(10);
        passwordFinal = bcrypt.hashSync(data.password, salt);
    }

    await pool.request()
        .input("cedula", data.cedula)
        .input("nombres", data.nombres)
        .input("apellidos", data.apellidos)
        .input("usuario", data.usuario)
        .input("password", passwordFinal)
        .input("rol", data.rol || "TECNICO")
        .input("estado", data.estado)
        .query(`
      UPDATE tecnicos SET
        nombres   = @nombres,
        apellidos = @apellidos,
        usuario   = @usuario,
        password  = COALESCE(@password, password),
        rol       = @rol,
        estado    = @estado
      WHERE cedula = @cedula
    `);

    return { ok: true };
};