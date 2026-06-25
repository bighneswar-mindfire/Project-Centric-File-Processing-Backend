import { Request, Response } from 'express';
import { jobService } from '../services/jobService.js';
import { JobStatus } from '../database/models/Job.js';

export const createZipJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { fileIds } = req.body;

    const result = await jobService.createZipJob(projectId as string, fileIds);
    res.status(201).json(result);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message.includes('belong') || err.message.includes('provide')) {
      res.status(400).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, jobId } = req.params;

    const job = await jobService.getJobStatus(projectId as string, jobId as string);

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

    res.status(200).json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      startedAt: job.startedAt || job.createdAt,
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

export const listProjectJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    // Call the service layer to retrieve the jobs list
    const result = await jobService.listJobs(projectId as string);

    res.status(200).json(result);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error occurred.' });
  }
};
