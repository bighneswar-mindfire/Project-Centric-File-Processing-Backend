import { Router } from 'express';
import { createZipJob, getJobStatus, listProjectJobs } from '../controllers/jobController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/projects/:projectId/jobs/zip', createZipJob);

router.get('/projects/:projectId/jobs/:jobId', getJobStatus);

router.get('/projects/:projectId/jobs', listProjectJobs);

export default router;
