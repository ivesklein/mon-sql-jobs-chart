const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(
  path.join(__dirname, 'views', 'template.html'),
  'utf8'
);

const timeOffsetMinutes =
  Number(process.env.TIME_OFFSET_MINUTES || '0') || 0;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAdjustedDate(value) {
  const original = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(original?.getTime())) return null;
  return new Date(original.getTime() + timeOffsetMinutes * 60 * 1000);
}

function renderTable(rows, jobName, basePath = '') {
  const formatHour = (value) => {
    const d = getAdjustedDate(value);
    if (!d || Number.isNaN(d.getTime())) return 'Hora desconocida';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    return `${m}-${day} ${h}:00`;
  };

  const formatDateTime = (value) => {
    const d = getAdjustedDate(value);
    if (Number.isNaN(d?.getTime())) return 'nunca';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${h}:${min}`;
  };

  const latestSuccess = rows
    .filter((row) => Number(row.RowsAffected) > 0)
    .reduce((latest, row) => {
      const current = new Date(row.StartTime);
      if (Number.isNaN(current.getTime())) return latest;
      if (!latest || current > latest) return current;
      return latest;
    }, null);

  const latestLabel = latestSuccess ? formatDateTime(latestSuccess) : 'nunca';

  const grouped = rows.reduce((acc, row) => {
    const key = formatHour(row.StartTime);
    const adjustedDate = getAdjustedDate(row.StartTime);
    if (!acc[key]) acc[key] = { rows: [], date: adjustedDate };
    acc[key].rows.push(row);
    return acc;
  }, {});

  const now = getAdjustedDate(new Date());
  const recentCutoff = now
    ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
    : null;

  const maxDurationByStep = rows.reduce((acc, row) => {
    const key = row.StepName || 'unknown';
    const value = Number(row.DurationMs);
    if (!Number.isFinite(value)) return acc;
    acc[key] = Math.max(acc[key] || 0, value);
    return acc;
  }, {});

  const maxRowsByStep = rows.reduce((acc, row) => {
    const key = row.StepName || 'unknown';
    const value = Number(row.RowsAffected);
    if (!Number.isFinite(value)) return acc;
    acc[key] = Math.max(acc[key] || 0, value);
    return acc;
  }, {});

  const tableRows = Object.entries(grouped)
    .map(([hourLabel, groupData]) => {
      const groupRows = groupData.rows;
      const groupDate = groupData.date;
      const isRecent =
        groupDate && recentCutoff ? groupDate >= recentCutoff : false;

      return groupRows
        .map((row, idx) => {
          const isError = Number(row.ErrorCode) !== 0;
          let rowsAffectedHtml;
          if (isError) {
            const message = escapeHtml(row.ErrorMessage || 'Error');
            rowsAffectedHtml = `
              <button class="eye-btn" type="button" data-message="${message}" aria-label="Ver error">&#128065;</button>
            `;
          } else if (Number(row.RowsAffected) === 0) {
            rowsAffectedHtml = escapeHtml('---');
          } else {
            rowsAffectedHtml = escapeHtml(row.RowsAffected);
          }
          const rowsAffectedClass = isError ? 'wrap error-cell' : 'num';
          const maxDuration = maxDurationByStep[row.StepName] || 0;
          const pct =
            maxDuration > 0
              ? Math.min(100, Math.max(0, (Number(row.DurationMs) / maxDuration) * 100))
              : 0;
          const maxRows = maxRowsByStep[row.StepName] || 0;
          const pctRows =
            maxRows > 0
              ? Math.min(100, Math.max(0, (Number(row.RowsAffected) / maxRows) * 100))
              : 0;

          const timeClasses = ['time'];
          if (isRecent) timeClasses.push('recent');

          const timeCell =
            idx === 0
              ? `<td class="${timeClasses.join(' ')}" rowspan="${groupRows.length}" data-label="Time">${escapeHtml(
                  hourLabel
                )}</td>`
              : '';

          return `
          <tr class="${isError ? 'error' : ''}">
            ${timeCell}
            <td data-label="StepName">${escapeHtml(row.StepName)}</td>
            <td data-label="DurationMs" class="num meter-cell" style="--pct:${pct}%;">${escapeHtml(
              row.DurationMs
            )}</td>
            <td data-label="RowsAffected" class="${rowsAffectedClass} meter-cell" style="--pct:${pctRows}%;">${rowsAffectedHtml}</td>
          </tr>`;
        })
        .join('\n');
    })
    .join('\n');

  const html = template
    .replace(/<!--JOB_NAME-->/g, escapeHtml(jobName))
    .replace(/<!--LAST_RUN-->/g, escapeHtml(latestLabel))
    .replace(/<!--BASE_PATH-->/g, basePath)
    .replace(
      '<!--TABLE_ROWS-->',
      tableRows || '<tr><td colspan="4">No data</td></tr>'
    );

  return html;
}

module.exports = {
  renderTable
};
