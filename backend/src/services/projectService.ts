import fs from 'fs/promises';
import { projectRepository } from '../repositories/projectRepository.js';
import { fileRepository } from '../repositories/fileRepository.js';
import { jobRepository } from '../repositories/jobRepository.js';
import { generateId } from '../utils/idGenerator.js';

export const projectService = {
  createProject: async (name: string, description: string) => {
    let projectId = generateId('proj');
    let idExists = await projectRepository.exists(projectId);

    while (idExists) {
      projectId = generateId('proj');
      idExists = await projectRepository.exists(projectId);
    }

    const newProject = await projectRepository.create({
      projectId,
      name,
      description,
    });

    return {
      id: newProject.projectId,
      name: newProject.name,
      description: newProject.description,
      createdAt: newProject.createdAt,
    };
  },

  getProjectDetails: async (projectId: string) => {
    const project = await projectRepository.findOne(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const [filesCount, jobsCount] = await Promise.all([
      fileRepository.count(projectId),
      jobRepository.count(projectId),
    ]);

    return {
      id: project.projectId,
      name: project.name,
      description: project.description,
      filesCount,
      jobsCount,
      createdAt: project.createdAt,
    };
  },

  listProjects: async () => {
    return projectRepository.findAllWithStats();
  },

  updateProject: async (projectId: string, updateData: { name?: string; description?: string }) => {
    const updatedProject = await projectRepository.findOneAndUpdate(projectId, updateData);
    if (!updatedProject) {
      throw new Error('Project not found');
    }
    return { message: 'Project updated successfully' };
  },

  deleteProject: async (projectId: string) => {
    const project = await projectRepository.findOne(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const files = await fileRepository.findManyByQuery({ projectId });
    for (const file of files) {
      try {
        if (file.path) {
          await fs.unlink(file.path);
        }
      } catch (unlinkError: unknown) {
        const systemError = unlinkError as NodeJS.ErrnoException;
        if (systemError.code !== 'ENOENT') {
          // eslint-disable-next-line no-console
          console.warn(`Warning: Failed to delete file at ${file.path}:`, unlinkError);
        }
      }
    }

    await Promise.all([
      projectRepository.deleteOne(projectId),
      fileRepository.deleteMany(projectId),
      jobRepository.deleteMany(projectId),
    ]);

    return { message: 'Project and all associated files and jobs deleted' };
  },
};
