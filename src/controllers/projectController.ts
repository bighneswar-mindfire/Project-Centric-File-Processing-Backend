/* eslint-disable no-console */
import { Request, Response } from 'express';
import { ProjectModel } from '../database/models/Project.js';
import { generateId } from '../utils/idGenerator.js';
import { FileModel } from '../database/models/File.js';
import { JobModel } from '../database/models/Job.js';
import fs from 'fs/promises';

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    // validation
    if (!name || !description) {
      res.status(400).json({ error: 'Project name and description required.' });
      return;
    }

    //generate id
    let projectId = generateId('proj');
    let idExists = await ProjectModel.exists({ projectId });

    //if id exists then create new id
    while (idExists) {
      projectId = generateId('proj');
      idExists = await ProjectModel.exists({ projectId });
    }

    //saving
    const newProject = new ProjectModel({
      projectId,
      name,
      description,
    });

    await newProject.save();

    //response
    res.status(201).json({
      id: newProject.projectId,
      name: newProject.name,
      description: newProject.description,
      createdAt: newProject.createdAt,
    });
  } catch (error) {
    console.error('Error inside createProject controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while creating project.' });
  }
};

export const getProjectDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    // search for projecy
    const project = await ProjectModel.findOne({ projectId });

    //if project not found
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // query for file and job count
    const [filesCount, jobsCount] = await Promise.all([
      FileModel.countDocuments({ projectId }),
      JobModel.countDocuments({ projectId }),
    ]);

    //response
    res.status(200).json({
      id: project.projectId,
      name: project.name,
      description: project.description,
      filesCount,
      jobsCount,
      createdAt: project.createdAt,
    });
  } catch (error) {
    console.error('Error inside getProjectDetails controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while retrieving project.' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    //project exists or not
    const project = await ProjectModel.findOne({ projectId });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    //finding project files
    const files = await FileModel.find({ projectId });

    //deleting files
    for (const file of files) {
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
    }

    //delete on db
    await Promise.all([
      ProjectModel.deleteOne({ projectId }),
      FileModel.deleteMany({ projectId }),
      JobModel.deleteMany({ projectId }),
    ]);

    //reponse
    res.status(200).json({
      message: 'Project and all associated files and jobs deleted',
    });
  } catch (error) {
    console.error('Error inside deleteProject controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while deleting project.' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    // 1. Build a dynamic update object so we only modify what the client actually sent
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

    // 2. Validate that at least one valid field was sent for update
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'Please provide a name or description to update.' });
      return;
    }

    const updatedProject = await ProjectModel.findOneAndUpdate(
      { projectId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    //project missing
    if (!updatedProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.status(200).json({
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error inside updateProject controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while updating project.' });
  }
};
