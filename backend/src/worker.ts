/* eslint-disable @typescript-eslint/no-explicit-any */
import { workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import * as archiver from 'archiver';
import { connectDatabase } from './database/index.js';
import { JobModel, JobStatus } from './database/models/Job.js';
import { FileModel } from './database/models/File.js';
import logger from './utils/logger.js';

interface WorkerPayload {
  jobId: string;
  projectId: string;
  fileIds: string[];
  filePaths: { name: string; path: string }[];
  outputZipPath: string;
  outputFileId: string;
  mongoUri: string;
}

const runCompression = async () => {
  const { jobId, projectId, filePaths, outputZipPath, outputFileId, mongoUri } =
    workerData as WorkerPayload;

  await connectDatabase(mongoUri);

  //check /uploads folder exists or not
  const uploadDir = path.dirname(outputZipPath);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  //write-stream on disk for zip
  const outputStream = fs.createWriteStream(outputZipPath);

  const archiverModule = archiver as any;

  const archive = (
    archiverModule.ZipArchive
      ? new archiverModule.ZipArchive({ zlib: { level: 9 } })
      : (archiverModule.default || archiverModule)('zip', { zlib: { level: 9 } })
  ) as any;

  //close stream
  outputStream.on('close', async () => {
    try {
      const fileSize = fs.statSync(outputZipPath).size;

      //saving zip metadata in db
      const zipFileMetadata = new FileModel({
        fileId: outputFileId,
        projectId,
        name: `${projectId}_files.zip`,
        size: fileSize,
        type: 'application/zip',
        path: outputZipPath,
      });
      await zipFileMetadata.save();

      //job status completed and progress 100%
      await JobModel.updateOne(
        { jobId, status: JobStatus.PROCESSING },
        {
          $set: {
            status: JobStatus.COMPLETED,
            progress: 100,
            outputFileId,
            completedAt: new Date(),
          },
        },
      );

      logger.info(`[Worker] Job ${jobId} completed successfully.`);
      process.exit(0);
    } catch (dbError) {
      logger.error({ err: dbError, jobId }, 'Error saving completed job details to database');
      process.exit(1);
    }
  });

  //error check
  archive.on('error', async (err: Error) => {
    logger.error({ err, jobId }, 'Archiver engine error');

    await JobModel.updateOne(
      { jobId },
      {
        $set: {
          status: JobStatus.FAILED,
          error: err.message,
          completedAt: new Date(),
        },
      },
    ).catch((dbErr) => logger.error({ err: dbErr }, 'Failed to write failure status to DB'));
    process.exit(1);
  });

  archive.pipe(outputStream);

  //append files to calculate and write progress updates
  const totalFiles = filePaths.length;
  for (let i = 0; i < totalFiles; i++) {
    const file = filePaths[i];

    if (fs.existsSync(file.path)) {
      archive.file(file.path, { name: file.name });
    } else {
      logger.warn(
        { path: file.path, jobId },
        'File missing on disk, skipping compression for this file',
      );
    }

    // Update db progress
    const progressPercent = Math.round(((i + 1) / totalFiles) * 100);

    //100% status update when the write stream closes
    if (progressPercent < 100) {
      await JobModel.updateOne(
        { jobId, status: JobStatus.PROCESSING },
        { $set: { progress: progressPercent } },
      ).catch((err) => logger.error({ err }, 'Progress update write failed'));
    }
  }

  //save compression stream
  await archive.finalize();
};

runCompression().catch(async (err) => {
  logger.fatal({ err }, 'Fatal execution exception in Worker Thread');

  const { jobId } = workerData as WorkerPayload;
  await JobModel.updateOne(
    { jobId },
    {
      $set: {
        status: JobStatus.FAILED,
        error: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      },
    },
  ).catch((dbErr) => logger.error({ err: dbErr }, 'Failed to record fatal failure status'));
  process.exit(1);
});
