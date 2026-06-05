import { Router } from 'express';
import { createZipJob, getJobStatus } from '../controllers/jobController.js';

const router = Router();

router.post('/projects/:projectId/jobs/zip', createZipJob);

router.get('/projects/:projectId/jobs/:jobId', getJobStatus);

export default router;
