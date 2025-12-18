require('dotenv').config();
const express = require('express');
const path = require('path');
const { isDbConfigured, getJobActivity } = require('./db');
const dummyData = require('./dummyData');
const { renderTable } = require('./render');

const app = express();
const port = process.env.PORT || 8090;
const basePath = process.env.BASE_PATH || '/chart';

app.use(basePath, express.static(path.join(__dirname, 'public')));

app.get(`${basePath}/table1`, async (req, res) => {
  const jobName = req.query.jobname;
  if (!jobName) {
    return res.status(400).send('Missing required query param: jobname');
  }

  try {
    let rows = [];

    if (isDbConfigured()) {
      rows = await getJobActivity(jobName);
    } else {
      rows = dummyData.filter((row) => row.JobName === jobName);
    }

    res.type('html').send(renderTable(rows, jobName, basePath));
  } catch (err) {
    console.error('Error running query', err);
    res.status(500).send('Failed to load job activity data');
  }
});

app.get(basePath, (req, res) => {
  res.redirect(`${basePath}/table1`);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
