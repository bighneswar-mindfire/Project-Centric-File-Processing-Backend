import fs from 'fs/promises';
import { fileRepository } from '../repositories/fileRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { generateId } from '../utils/idGenerator.js';
import { getMimeType } from '../utils/mimeTypeHelper.js';

export const fileService = {
  uploadFiles: async (projectId: string, filesList: Express.Multer.File[] | undefined) => {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) {
      if (filesList && Array.isArray(filesList)) {
        for (const file of filesList) {
          await fs.unlink(file.path).catch((err) =>
            // eslint-disable-next-line no-console
            console.error(`Warning: Failed to clean up file at ${file.path}:`, err),
          );
        }
      }
      throw new Error('Project not found');
    }

    if (!filesList || filesList.length === 0) {
      throw new Error('No files uploaded.');
    }

    const savedFilesMetadata = [];

    for (const file of filesList) {
      let fileId = generateId('file');
      let idExists = await fileRepository.exists(fileId);

      while (idExists) {
        fileId = generateId('file');
        idExists = await fileRepository.exists(fileId);
      }

      const fileDoc = await fileRepository.create({
        fileId,
        projectId,
        name: file.originalname,
        size: file.size,
        type: getMimeType(file.originalname, file.mimetype),
        path: file.path,
      });

      savedFilesMetadata.push({
        fileId: fileDoc.fileId,
        name: fileDoc.name,
        size: fileDoc.size,
        type: fileDoc.type,
        uploadedAt: fileDoc.uploadedAt,
      });
    }

    return {
      projectId,
      files: savedFilesMetadata,
    };
  },

  listProjectFiles: async (projectId: string) => {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) {
      throw new Error('Project not found');
    }

    return fileRepository.findProjectFiles(projectId);
  },

  deleteFile: async (projectId: string, fileId: string) => {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) {
      throw new Error('Project not found');
    }

    const fileExists = await fileRepository.exists(fileId);
    if (!fileExists) {
      throw new Error('File not found for this project');
    }

    await fileRepository.softDelete(projectId, fileId);

    return { message: 'File deleted successfully' };
  },

  getFileForDownload: async (projectId: string, fileId: string) => {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) {
      throw new Error('Project not found');
    }

    const file = await fileRepository.findOne(projectId, fileId);
    if (!file) {
      throw new Error('File not found for this project');
    }

    try {
      await fs.access(file.path);
    } catch {
      throw new Error('Physical file not found on disk');
    }

    return file;
  },
};
