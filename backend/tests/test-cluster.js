import { generateClustersForTesting, regionToString } from '../index.js';

function makeJob(id, colPc, delPc, colDate, delDate) {
  return {
    job_id: id,
    collection_postcode: colPc,
    delivery_postcode: delPc,
    collection_date: colDate,
    delivery_date: delDate,
  };
}

const jobs = [
  makeJob('JOB-1', 'SW1A 1AA', 'SN1 1AA', '2025-09-10', '2025-09-10'), // London-ish -> Swindon-ish
  makeJob('JOB-2', 'SN1 1AA', 'SW1A 1AA', '2025-09-10', '2025-09-10'), // Swindon-ish -> London-ish
  makeJob('JOB-3', 'OX1 1AA', 'OX2 2BB', '2025-09-12', '2025-09-12'), // Oxford -> Oxford (single)
  makeJob('JOB-4', '', 'NW1 4ER', '2025-09-11', '2025-09-11'), // Missing collection postcode
];

const drivers = [
  { Name: 'Alice', postcode: 'SW1A 1AA', region: 'South East' },
  { Name: 'Bob', postcode: 'SN1 1AA', region: 'South West' },
];

(async () => {
  try {
    const clusters = generateClustersForTesting(jobs, drivers);
    console.log('Clusters produced:', clusters.map(c => ({ clusterId: c.clusterId, jobs: c.jobs.map(j => j.job_id) })));
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(2);
  }
})();
