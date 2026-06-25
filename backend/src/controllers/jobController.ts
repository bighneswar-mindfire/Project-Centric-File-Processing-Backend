/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProjectModel } from '../database/models/Project.js';
import { FileModel } from '../database/models/File.js';
import { JobModel, JobStatus } from '../database/models/Job.js';
import { generateId } from '../utils/idGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//worker node
const isProd = process.env.NODE_ENV === 'production';
const workerPath = isProd
  ? path.resolve(__dirname, '../worker.js')
  : path.resolve(__dirname, '../worker.ts');

export const createZipJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { fileIds } = req.body;

    //check project exists
    const projectExists = await ProjectModel.exists({ projectId });
    if (!projectExists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      res.status(400).json({ error: 'Please provide an array of fileIds to compress.' });
      return;
    }

    const matchingFiles = await FileModel.find({
      projectId,
      fileId: { $in: fileIds },
    });

    if (matchingFiles.length !== fileIds.length) {
      res.status(400).json({ error: 'File does not belong to this project' });
      return;
    }

    const jobId = generateId('job');
    const outputFileId = generateId('file');
    const outputZipPath = `uploads/${projectId}_files_${Date.now()}.zip`;

    const job = new JobModel({
      jobId,
      projectId,
      type: 'ZIP_COMPRESSION',
      status: JobStatus.PROCESSING,
      progress: 0,
      fileIds,
    });
    await job.save();

    const filePaths = matchingFiles.map((file) => ({
      name: file.name,
      path: file.path,
    }));

    const MONGO_URI = process.env.MONGO_URI;

    const worker = new Worker(workerPath, {
      workerData: {
        jobId,
        projectId,
        fileIds,
        filePaths,
        outputZipPath,
        outputFileId,
        mongoUri: MONGO_URI,
      },
      //tsx wrapper in development mode to run ts files natively
      execArgv: isProd ? [] : ['--import', 'tsx'],
    });

    //handle thread crashes
    worker.on('error', (err) => {
      console.error(`[Main Thread] Worker Thread crashed for Job ${jobId}:`, err);
    });

    //response
    res.status(201).json({
      jobId: job.jobId,
      projectId: job.projectId,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt || new Date(),
    });
  } catch (error) {
    console.error('Error inside createZipJob controller:', error);
    res
      .status(500)
      .json({ error: 'Internal server error occurred while launching compression job.' });
  }
};

export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, jobId } = req.params;

    const projectExists = await ProjectModel.exists({ projectId });
    if (!projectExists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const job = await JobModel.findOne({ projectId, jobId });
    if (!job) {
      res.status(404).json({ error: 'Job not found for this project' });
      return;
    }
    if (job.status === JobStatus.COMPLETED) {
      res.status(200).json({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        outputFileId: job.outputFileId,
        completedAt: job.completedAt,
      });
      return;
    }

    if (job.status === JobStatus.FAILED) {
      res.status(200).json({
        jobId: job.jobId,
        status: job.status,
        error: job.error,
      });
      return;
    }

    //response
    res.status(200).json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      startedAt: job.startedAt || job.createdAt,
    });
  } catch (error) {
    console.error('Error inside getJobStatus controller:', error);
    res.status(500).json({ error: 'Internal server error occurred while retrieving job status.' });
  }
};

export const listJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const projectExists = await ProjectModel.exists({ projectId });
    if (!projectExists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const jobs = await JobModel.find({ projectId }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error in listJobs controller:', error);
    res.status(500).json({ error: 'Internal server error occurred.' });
  }
};
