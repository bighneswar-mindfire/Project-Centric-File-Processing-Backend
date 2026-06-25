import { Router } from 'express';
import { uploadFiles } from '../controllers/fileController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { listProjectFiles } from '../controllers/fileController.js';
import { deleteFile, downloadFile } from '../controllers/fileController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/projects/:projectId/files', upload.array('files'), uploadFiles);

router.get('/projects/:projectId/files', listProjectFiles);

router.delete('/projects/:projectId/files/:fileId', deleteFile);

router.get('/projects/:projectId/files/:fileId/download', downloadFile);

export default router;
