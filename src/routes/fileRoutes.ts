import { Router } from 'express';
import { uploadFiles } from '../controllers/fileController.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/projects/:projectId/files', upload.array('files'), uploadFiles);

export default router;
