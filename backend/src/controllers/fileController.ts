import { Request, Response } from 'express';
import { fileService } from '../services/fileService.js';

export const uploadFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const filesList = req.files as Express.Multer.File[];

    const result = await fileService.uploadFiles(projectId as string, filesList);
    res.status(201).json(result);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message.includes('No files')) {
      res.status(400).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const listProjectFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const result = await fileService.listProjectFiles(projectId as string);
    res.status(200).json(result);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, fileId } = req.params;

    const result = await fileService.deleteFile(projectId as string, fileId as string);
    res.status(200).json(result);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, fileId } = req.params;

    const file = await fileService.getFileForDownload(projectId as string, fileId as string);

    res.download(file.path, file.name, (err?: Error) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error downloading file.' });
        }
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error.' });
  }
};
