import { Router } from 'express';
import { createZipJob } from '../controllers/jobController.js';

const router = Router();

router.post('/projects/:projectId/jobs/zip', createZipJob);

export default router;
