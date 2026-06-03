/* eslint-disable no-console */
import { Request, Response } from 'express';
import { ProjectModel } from '../database/models/Project.js'; // Note the explicit .js extension (required for ESM)
import { generateId } from '../utils/idGenerator.js';

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
