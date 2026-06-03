import { Router } from 'express';
import { createProject } from '../controllers/projectController.js';

const router = Router();

router.post('/projects', createProject);

export default router;
