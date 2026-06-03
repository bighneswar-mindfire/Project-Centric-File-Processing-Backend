/* eslint-disable no-console */
import { Request, Response } from 'express';
import { ProjectModel } from '../database/models/Project.js';
import { generateId } from '../utils/idGenerator.js';
import { FileModel } from '../database/models/File.js';
import { JobModel } from '../database/models/Job.js';

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
