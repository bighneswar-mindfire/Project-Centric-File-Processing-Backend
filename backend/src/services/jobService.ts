import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { jobRepository } from '../repositories/jobRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { fileRepository } from '../repositories/fileRepository.js';
import { generateId } from '../utils/idGenerator.js';
import { JobStatus } from '../database/models/Job.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const workerPath = isProd
  ? path.resolve(__dirname, '../worker.js')
  : path.resolve(__dirname, '../worker.ts');

export const jobService = {
  createZipJob: async (projectId: string, fileIds: string[]) => {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) {
      throw new Error('Project not found');
    }

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new Error('Please provide an array of fileIds to compress.');
    }

    const matchingFiles = await fileRepository.findManyByQuery({
      projectId,
      fileId: { $in: fileIds },
    });

    if (matchingFiles.length !== fileIds.length) {
      throw new Error('File does not belong to this project');
    }

    const jobId = generateId('job');
    const outputFileId = generateId('file');
    const outputZipPath = `uploads/${projectId}_files_${Date.now()}.zip`;

    const job = await jobRepository.create({
      jobId,
      projectId,
      type: 'ZIP_COMPRESSION',
      status: JobStatus.PROCESSING,
      progress: 0,
      fileIds,
    });

    const filePaths = matchingFiles.map((file) => ({
      name: file.name,
      path: file.path,
    }));

    const getMongoUri = (): string => {
      if (process.env.MONGO_URI) {
        return process.env.MONGO_URI;
      }

      const activeDbName = mongoose.connection.name || 'project_centric_file_processor';
      return `mongodb://127.0.0.1:27017/${activeDbName}`;
    };

    const MONGO_URI = getMongoUri();

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
      execArgv: isProd ? [] : ['--import', 'tsx'],
    });

    worker.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error(`[Main Thread] Worker Thread crashed for Job ${jobId}:`, err);
    });

    return {
      jobId: job.jobId,
      projectId: job.projectId,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
    };
  },

  getJobStatus: async (projectId: string, jobId: string) => {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) {
      throw new Error('Project not found');
    }

    const job = await jobRepository.findOne(projectId, jobId);
    if (!job) {
      throw new Error('Job not found for this project');
    }

    return job;
  },

  listJobs: async (projectId: string) => {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) {
      throw new Error('Project not found');
    }

    return jobRepository.findManyByProjectId(projectId);
  },
};
