import sql from "mssql";

const connectionString = 
  "Driver={ODBC Driver 17 for SQL Server};" +
  "Server=easyfarmabdd.farmaenlace.com;" +
  "Database=EasyGestionEmpresarial;" +
  `UID=FARMAENLACE0\\jchamba;`+
  "PWD=Farma2026*;"+
  "Trusted_Connection=yes;" +
  "TrustServerCertificate=yes;";

console.log("Intentando conectar...");

try {
  const pool = new sql.ConnectionPool(connectionString);
  await pool.connect();
  
  const result = await pool.request().query(`
    SELECT 
      SYSTEM_USER AS usuario_sql,
      CURRENT_USER AS usuario_bd,
      @@SERVERNAME AS servidor
  `);
  
  console.log("✅ Conectado como:", result.recordset[0]);
  await pool.close();
} catch (err) {
  console.error("❌ Error:", err.message);
  console.error("Detalle:", err);
}