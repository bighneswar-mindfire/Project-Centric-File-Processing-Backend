import { Router } from 'express';
import { createZipJob, getJobStatus, listJobs } from '../controllers/jobController.js';

const router = Router();

router.post('/projects/:projectId/jobs/zip', createZipJob);

router.get('/projects/:projectId/jobs/:jobId', getJobStatus);

router.get('/projects/:projectId/jobs', listJobs);

export default router;
