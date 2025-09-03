import fetch from 'node-fetch';

async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/jobs/export-processed', { method: 'POST' });
    const data = await res.json();
    console.log('Export response:', data);
  } catch (err) {
    console.error('Error calling export endpoint:', err.message || err);
  }
}

run();
