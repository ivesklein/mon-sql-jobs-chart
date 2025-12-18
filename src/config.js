const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

function isDbConfigured() {
  return Boolean(dbConfig.user && dbConfig.password && dbConfig.database);
}

module.exports = {
  dbConfig,
  isDbConfigured
};
