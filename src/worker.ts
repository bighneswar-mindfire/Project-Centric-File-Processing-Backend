/* eslint-disable no-console */
import { workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import { connectDatabase } from './database/index.js';
import { JobModel, JobStatus } from './database/models/Job.js';
import { FileModel } from './database/models/File.js';

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
  const archive = archiver('zip', { zlib: { level: 9 } });

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

      //job status:completed and progress:100%
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

      console.log(`[Worker] Job ${jobId} completed successfully.`);
      process.exit(0);
    } catch (dbError) {
      console.error('[Worker] Error saving completed job details:', dbError);
      process.exit(1);
    }
  });

  //error check
  archive.on('error', async (err) => {
    console.error(`[Worker] Archiver error on Job ${jobId}:`, err);
    await JobModel.updateOne(
      { jobId },
      {
        $set: {
          status: JobStatus.FAILED,
          error: err.message,
          completedAt: new Date(),
        },
      },
    ).catch((dbErr) => console.error('[Worker] Failed to write failure status:', dbErr));
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
      console.warn(`[Worker] File missing on disk, skipping: ${file.path}`);
    }

    // Update db progress
    const progressPercent = Math.round(((i + 1) / totalFiles) * 100);

    //100% status update when the write stream closes
    if (progressPercent < 100) {
      await JobModel.updateOne(
        { jobId, status: JobStatus.PROCESSING },
        { $set: { progress: progressPercent } },
      ).catch((err) => console.error('[Worker] Progress update write failed:', err));
    }
  }

  //save compression stream
  await archive.finalize();
};

runCompression().catch(async (err) => {
  console.error('[Worker] Fatal execution exception:', err);
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
  ).catch((dbErr) => console.error('[Worker] Failed to record failure status:', dbErr));
  process.exit(1);
});
