/* eslint-disable no-console */
import { Request, Response } from 'express';
import fs from 'fs/promises';
import { ProjectModel } from '../database/models/Project.js';
import { FileModel } from '../database/models/File.js';
import { generateId } from '../utils/idGenerator.js';

export const uploadFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    //check project exist or not
    const projectExists = await ProjectModel.exists({ projectId });

    if (!projectExists) {
      //if project doesnot exist then delete the file
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await fs
            .unlink(file.path)
            .catch((err) =>
              console.error(`Warning: Failed to clean up orphaned file at ${file.path}:`, err),
            );
        }
      }
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    //check file upload
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({ error: 'No files uploaded.' });
      return;
    }

    const uploadedFiles = req.files as Express.Multer.File[];
    const savedFilesMetadata = [];

    //save filedata in db
    for (const file of uploadedFiles) {
      let fileId = generateId('file');
      let idExists = await FileModel.exists({ fileId });

      while (idExists) {
        fileId = generateId('file');
        idExists = await FileModel.exists({ fileId });
      }

      const fileDoc = new FileModel({
        fileId,
        projectId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        path: file.path,
      });

      await fileDoc.save();

      savedFilesMetadata.push({
        fileId: fileDoc.fileId,
        name: fileDoc.name,
        size: fileDoc.size,
        type: fileDoc.type,
        uploadedAt: fileDoc.uploadedAt,
      });
    }

    //response
    res.status(201).json({
      projectId,
      files: savedFilesMetadata,
    });
  } catch (error) {
    console.error('Error inside uploadFiles controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while uploading files.' });
  }
};

export const listProjectFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    //check project exists or not
    const projectExists = await ProjectModel.exists({ projectId });
    if (!projectExists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    //fetch the files from db
    const files = await FileModel.find({ projectId }).select('fileId name size -_id');

    //response
    res.status(200).json(files);
  } catch (error) {
    console.error('Error inside listProjectFiles controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while retrieving files.' });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, fileId } = req.params;

    //check project exists or not
    const projectExists = await ProjectModel.exists({ projectId });
    if (!projectExists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    //check file exists in that project
    const file = await FileModel.findOne({ projectId, fileId });
    if (!file) {
      res.status(404).json({ error: 'File not found for this project' });
      return;
    }

    //delete from uploads folder
    try {
      if (file.path) {
        await fs.unlink(file.path);
      }
    } catch (unlinkError: unknown) {
      const systemError = unlinkError as NodeJS.ErrnoException;

      if (systemError.code !== 'ENOENT') {
        console.warn(`Warning: Failed to delete physical file at ${file.path}:`, unlinkError);
      }
    }

    //delete data from db
    await FileModel.deleteOne({ projectId, fileId });

    //response
    res.status(200).json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error inside deleteFile controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while deleting the file.' });
  }
};
