const express = require('express');
const sql = require('mssql');

const app = express();
const port = process.env.PORT || 8090;

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

let pool;

const dummyData = [
  {
    LogId: 591,
    JobName: 'Actualiza u_clasificacion SN',
    StepName: 'General Error',
    RowsAffected: null,
    DurationMs: 4236,
    ErrorCode: 1,
    ErrorMessage:
      'La transacción (id. de proceso 354) quedó en interbloqueo en bloqueo | búfer de comunicaciones recursos con otro proceso y fue elegida como sujeto del interbloqueo. Ejecute de nuevo la transacción.',
    StartTime: '2025-12-18 15:00:00.310'
  },
  {
    LogId: 446,
    JobName: 'Actualiza u_clasificacion SN',
    StepName: 'Delete registros antiguos',
    RowsAffected: 761,
    DurationMs: 11,
    ErrorCode: 0,
    ErrorMessage: null,
    StartTime: '2025-12-18 03:00:33.307'
  },
  {
    LogId: 444,
    JobName: 'Actualiza u_clasificacion SN',
    StepName: 'UserSign 187',
    RowsAffected: 0,
    DurationMs: 12447,
    ErrorCode: 0,
    ErrorMessage: null,
    StartTime: '2025-12-18 03:00:00.541'
  },
  {
    LogId: 445,
    JobName: 'Actualiza u_clasificacion SN',
    StepName: 'GroupCode RETAIL',
    RowsAffected: 362,
    DurationMs: 32739,
    ErrorCode: 0,
    ErrorMessage: null,
    StartTime: '2025-12-18 03:00:00.541'
  },
  {
    LogId: 294,
    JobName: 'Actualiza u_clasificacion SN',
    StepName: 'Delete registros antiguos',
    RowsAffected: 761,
    DurationMs: 3,
    ErrorCode: 0,
    ErrorMessage: null,
    StartTime: '2025-12-17 15:00:09.107'
  },
  {
    LogId: 292,
    JobName: 'Actualiza u_clasificacion SN',
    StepName: 'UserSign 187',
    RowsAffected: 0,
    DurationMs: 4998,
    ErrorCode: 0,
    ErrorMessage: null,
    StartTime: '2025-12-17 15:00:00.387'
  },
  {
    LogId: 293,
    JobName: 'Actualiza u_clasificacion SN',
    StepName: 'GroupCode RETAIL',
    RowsAffected: 30,
    DurationMs: 8677,
    ErrorCode: 0,
    ErrorMessage: null,
    StartTime: '2025-12-17 15:00:00.387'
  }
];

function isDbConfigured() {
  return Boolean(dbConfig.user && dbConfig.password && dbConfig.database);
}

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTable(rows, jobName) {
  const tableRows = rows
    .map(
      (row) => `
          <tr>
            <td data-label="LogId">${escapeHtml(row.LogId)}</td>
            <td data-label="JobName">${escapeHtml(row.JobName)}</td>
            <td data-label="StepName">${escapeHtml(row.StepName)}</td>
            <td data-label="RowsAffected" class="num">${escapeHtml(row.RowsAffected)}</td>
            <td data-label="DurationMs" class="num">${escapeHtml(row.DurationMs)}</td>
            <td data-label="ErrorCode" class="num">${escapeHtml(row.ErrorCode)}</td>
            <td data-label="ErrorMessage" class="wrap">${escapeHtml(row.ErrorMessage)}</td>
            <td data-label="StartTime">${escapeHtml(
              row.StartTime instanceof Date
                ? row.StartTime.toISOString()
                : row.StartTime
            )}</td>
          </tr>`
    )
    .join('\n');

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeHtml(jobName)} - Job Activity Log</title>
      <style>
        :root {
          color-scheme: light;
          --bg: #0f172a;
          --card: #111827;
          --text: #e2e8f0;
          --muted: #94a3b8;
          --accent: #38bdf8;
          --border: #1f2937;
        }
        body {
          margin: 0;
          font-family: "Segoe UI", Tahoma, sans-serif;
          background: radial-gradient(circle at 20% 20%, rgba(56,189,248,0.2), transparent 25%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.15), transparent 25%), var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .card {
          width: min(1200px, 100%);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.25);
          overflow: hidden;
        }
        header {
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(90deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15));
          border-bottom: 1px solid var(--border);
        }
        h1 {
          margin: 0;
          font-size: 20px;
          letter-spacing: 0.3px;
        }
        .pill {
          font-size: 12px;
          color: var(--card);
          background: var(--accent);
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        th, td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          vertical-align: top;
        }
        th {
          text-align: left;
          color: var(--muted);
          font-weight: 600;
          background: rgba(255,255,255,0.02);
        }
        td {
          color: var(--text);
        }
        tr:hover td {
          background: rgba(56,189,248,0.06);
        }
        .num {
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .wrap {
          max-width: 320px;
          white-space: pre-wrap;
          word-break: break-word;
        }
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr { display: block; }
          thead { display: none; }
          tr { border-bottom: 1px solid var(--border); padding: 12px; }
          td { border: 0; padding: 6px 0; }
          td::before {
            content: attr(data-label);
            display: block;
            color: var(--muted);
            font-size: 12px;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <header>
          <h1>${escapeHtml(jobName)}</h1>
          <span class="pill">Job activity log</span>
        </header>
        <div class="table-wrapper">
          <table aria-label="Job activity results">
            <thead>
              <tr>
                <th>LogId</th>
                <th>JobName</th>
                <th>StepName</th>
                <th>RowsAffected</th>
                <th>DurationMs</th>
                <th>ErrorCode</th>
                <th>ErrorMessage</th>
                <th>StartTime</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="8">No data</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </body>
  </html>`;
}

app.get('/table1', async (req, res) => {
  const jobName = req.query.jobname;
  if (!jobName) {
    return res.status(400).send('Missing required query param: jobname');
  }

  try {
    let rows = [];

    if (isDbConfigured()) {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('jobName', sql.VarChar, jobName)
        .query(
          `SELECT LogId, JobName, StepName, RowsAffected, DurationMs, ErrorCode, ErrorMessage, StartTime
           FROM dbo.JobActivityLog
           WHERE JobName = @jobName
           ORDER BY StartTime DESC;`
        );
      rows = result.recordset;
    } else {
      rows = dummyData.filter((row) => row.JobName === jobName);
    }

    res.type('html').send(renderTable(rows, jobName));
  } catch (err) {
    console.error('Error running query', err);
    res.status(500).send('Failed to load job activity data');
  }
});

app.get('/', (req, res) => {
  res.redirect('/table1');
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
