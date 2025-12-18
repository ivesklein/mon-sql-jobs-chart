const sql = require('mssql');
const { dbConfig, isDbConfigured } = require('./config');

let pool;

async function getPool() {
  if (pool) {
    return pool;
  }

  pool = await new sql.ConnectionPool(dbConfig).connect();
  pool.on('error', (err) => {
    console.error('SQL pool error', err);
    pool = null;
  });
  return pool;
}

async function getJobActivity(jobName) {
  const poolConn = await getPool();
  const result = await poolConn
    .request()
    .input('jobName', sql.VarChar, jobName)
    .query(
      `SELECT StepName, DurationMs, RowsAffected, ErrorCode, ErrorMessage, StartTime
       FROM dbo.JobActivityLog
       WHERE JobName = @jobName
       ORDER BY StartTime DESC;`
    );
  return result.recordset;
}

module.exports = {
  isDbConfigured,
  getJobActivity
};
