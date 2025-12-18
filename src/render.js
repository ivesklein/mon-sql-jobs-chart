const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(
  path.join(__dirname, 'views', 'template.html'),
  'utf8'
);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTable(rows, jobName) {
  const formatHour = (value) => {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return 'Hora desconocida';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:00`;
  };

  const grouped = rows.reduce((acc, row) => {
    const key = formatHour(row.StartTime);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const tableRows = Object.entries(grouped)
    .map(([hourLabel, groupRows]) =>
      groupRows
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

          const timeCell =
            idx === 0
              ? `<td class="time" rowspan="${groupRows.length}" data-label="Time">${escapeHtml(
                  hourLabel
                )}</td>`
              : '';

          return `
          <tr class="${isError ? 'error' : ''}">
            ${timeCell}
            <td data-label="StepName">${escapeHtml(row.StepName)}</td>
            <td data-label="DurationMs" class="num">${escapeHtml(row.DurationMs)}</td>
            <td data-label="RowsAffected" class="${rowsAffectedClass}">${rowsAffectedHtml}</td>
          </tr>`;
        })
        .join('\n')
    )
    .join('\n');

  const html = template
    .replace('<!--JOB_NAME-->', escapeHtml(jobName))
    .replace(
      '<!--TABLE_ROWS-->',
      tableRows || '<tr><td colspan="4">No data</td></tr>'
    );

  return html;
}

module.exports = {
  renderTable
};
