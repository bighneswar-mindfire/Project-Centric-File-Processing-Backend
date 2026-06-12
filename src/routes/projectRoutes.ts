import { Router } from 'express';
import { createProject } from '../controllers/projectController.js';
import { getProjectDetails } from '../controllers/projectController.js';
import { deleteProject, updateProject, listProjects } from '../controllers/projectController.js';

const router = Router();

router.post('/projects', createProject);

router.get('/projects', listProjects);

router.get('/projects/:projectId', getProjectDetails);

router.delete('/projects/:projectId', deleteProject);

router.put('/projects/:projectId', updateProject);

export default router;
