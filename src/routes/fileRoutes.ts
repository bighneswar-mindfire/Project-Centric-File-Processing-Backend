import { Router } from 'express';
import { uploadFiles } from '../controllers/fileController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { listProjectFiles } from '../controllers/fileController.js';
import { deleteFile } from '../controllers/fileController.js';

const router = Router();

router.post('/projects/:projectId/files', upload.array('files'), uploadFiles);

router.get('/projects/:projectId/files', listProjectFiles);

router.delete('/projects/:projectId/files/:fileId', deleteFile);

export default router;
