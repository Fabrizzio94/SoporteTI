import sql from "mssql";

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // true si usas Azure SQL
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

let matrizPool: sql.ConnectionPool | null = null;

export async function getMatrizConnection() {
  if (matrizPool?.connected) return matrizPool;

  const connectionString = 
    `Driver={ODBC Driver 17 for SQL Server};` +
    `Server=${process.env.MATRIZ_SERVER!};` +
    `Database=${process.env.MATRIZ_NAME!};` +
    `UID=${process.env.MATRIZ_USER};`+
    `PWD=${process.env.MATRIZ_PASSWORD};`+
    `Trusted_Connection=yes;` +
    `TrustServerCertificate=yes;`;

  const matrizConfig: sql.config = {
    driver: "msnodesqlv8",
    connectionString,
    options: {
      trustedConnection: true,
      encrypt: false,
      trustServerCertificate: true,
    },
  } as any;


    try {
      // Creamos el pool indicando que use el driver de Windows
      const matrizPool =  new sql.ConnectionPool(connectionString);
      await matrizPool.connect();
      return matrizPool;
      console.log("Conectado exitosamente a Matriz via WinAuth");
    } catch (err) {
      console.error("Error en conexión Matriz:", err);
      throw err;
    }
  
}