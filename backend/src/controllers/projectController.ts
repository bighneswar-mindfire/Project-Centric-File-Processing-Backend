import { Request, Response } from 'express';
import { projectService } from '../services/projectService.js';

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      res.status(400).json({ error: 'Project name and description are required.' });
      return;
    }

    const result = await projectService.createProject(name, description);
    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error occurred.' });
  }
};

export const getProjectDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const result = await projectService.getProjectDetails(projectId as string);
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

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const updateData: { name?: string; description?: string } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'Name must be a non-empty string.' });
        return;
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        res.status(400).json({ error: 'Description must be a non-empty string.' });
        return;
      }
      updateData.description = description.trim();
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'Please provide a name or description to update.' });
      return;
    }

    const result = await projectService.updateProject(projectId as string, updateData);
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

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const result = await projectService.deleteProject(projectId as string);
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

export const listProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await projectService.listProjects();
    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error occurred.' });
  }
};
