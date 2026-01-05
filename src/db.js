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
      `SELECT TOP 50 StepName, DurationMs, RowsAffected, ErrorCode, ErrorMessage, StartTime
       FROM dbo.JobActivityLog
       WHERE JobName = @jobName
       ORDER BY StartTime DESC;`
    );
  return result.recordset;
}


async function getJobErrors() {
  const poolConn = await getPool();
  const result = await poolConn
    .request()
    .query(`
      SELECT
        j.name AS JobName,
        h.message,
        RunDateTime =
            DATEADD(
                SECOND,
                (h.run_time / 10000) * 3600 +
                ((h.run_time % 10000) / 100) * 60 +
                (h.run_time % 100),
                CONVERT(datetime, CONVERT(char(8), h.run_date))
            )
      FROM msdb..sysjobhistory h
      JOIN msdb..sysjobs j
        ON h.job_id = j.job_id
      WHERE h.step_id <> 0
        AND h.run_status = 0
      ORDER BY RunDateTime DESC;
    `);
  return result.recordset;
}

module.exports = {
  isDbConfigured,
  getJobActivity,
  getJobErrors
};
