import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import { viteNodeApp } from '../index.js';
import { ProjectModel } from '../database/models/Project.js';
import { FileModel } from '../database/models/File.js';
import { JobModel } from '../database/models/Job.js';
import { connectDatabase } from '../database/index.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/project_centric_file_processor_test_job';
const TEST_FILE_PATH_1 = 'uploads/file1.txt';
const TEST_FILE_PATH_2 = 'uploads/file2.txt';
let projectId: string;
let fileId1: string;
let fileId2: string;
let jobId: string;

beforeAll(async () => {
  await connectDatabase(TEST_MONGO_URI);
  await ProjectModel.deleteMany({});
  await FileModel.deleteMany({});
  await JobModel.deleteMany({});

  await fs.writeFile(TEST_FILE_PATH_1, 'Standard asset file 1.');
  await fs.writeFile(TEST_FILE_PATH_2, 'Standard asset file 2.');
});

afterAll(async () => {
  if (projectId) {
    //find all file associated with this test project
    const files = await FileModel.find({ projectId });

    //delete files
    for (const file of files) {
      await fs.unlink(file.path).catch(() => {});
    }

    //db cleanup
    await ProjectModel.deleteOne({ projectId });
    await FileModel.deleteMany({ projectId });
    await JobModel.deleteMany({ projectId });
  }

  //delete dummy test files
  await fs.unlink(TEST_FILE_PATH_1).catch(() => {});
  await fs.unlink(TEST_FILE_PATH_2).catch(() => {});

  await mongoose.disconnect();
});

describe('job controller and worker thread API', () => {
  it('Setup: Create a project and upload two files', async () => {
    const projRes = await request(viteNodeApp)
      .post('/api/projects')
      .send({ name: 'Job Test Project', description: 'testing compression' });
    projectId = projRes.body.id;

    const fileRes1 = await request(viteNodeApp)
      .post(`/api/projects/${projectId}/files`)
      .attach('files', TEST_FILE_PATH_1);
    fileId1 = fileRes1.body.files[0].fileId;

    const fileRes2 = await request(viteNodeApp)
      .post(`/api/projects/${projectId}/files`)
      .attach('files', TEST_FILE_PATH_2);
    fileId2 = fileRes2.body.files[0].fileId;
  });

  it('POST /api/projects/:projectId/jobs/zip - should start compression', async () => {
    const res = await request(viteNodeApp)
      .post(`/api/projects/${projectId}/jobs/zip`)
      .send({
        fileIds: [fileId1, fileId2],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body.status).toBe('PROCESSING');

    jobId = res.body.jobId;
  });

  it('GET /api/projects/:projectId/jobs/:jobId - check for compression is complete', async () => {
    let jobStatus = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 15;

    while (jobStatus === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const res = await request(viteNodeApp).get(`/api/projects/${projectId}/jobs/${jobId}`);

      expect(res.status).toBe(200);
      jobStatus = res.body.status;
      attempts++;
    }

    expect(jobStatus).toBe('COMPLETED');
  });
});
