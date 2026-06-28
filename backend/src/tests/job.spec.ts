import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// 1. SET ENV VARIABLES AT THE VERY TOP (Crucial for isolation)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'f978e8b2e3f6e100f91a547b74b1e59c1c68f12d2db763e0078b5490fd38927a';

import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import { SignJWT } from 'jose';
import { viteNodeApp } from '../index.js';
import { ProjectModel } from '../database/models/Project.js';
import { FileModel } from '../database/models/File.js';
import { JobModel } from '../database/models/Job.js';
import { UserModel } from '../database/models/User.js';
import { connectDatabase } from '../database/index.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/project_centric_test_job_simple';
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

const TEST_FILE_1 = 'uploads/job_test_1.txt';
const TEST_FILE_2 = 'uploads/job_test_2.txt';

let authToken: string;
let projectId: string;
let fileId1: string;
let fileId2: string;

beforeAll(async () => {
  await connectDatabase(TEST_DB_URI);

  await ProjectModel.deleteMany({});
  await FileModel.deleteMany({});
  await JobModel.deleteMany({});
  await UserModel.deleteMany({});

  const testEmail = 'job-tester@example.com';
  await UserModel.create({ email: testEmail, passwordHash: 'h', salt: 's' });
  authToken = await new SignJWT({ email: testEmail })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(SECRET_KEY);

  const projRes = await request(viteNodeApp)
    .post('/api/projects')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Job Simple Project', description: 'Trigger Test' });
  projectId = projRes.body.id;

  await fs.writeFile(TEST_FILE_1, 'Hello world from file 1');
  await fs.writeFile(TEST_FILE_2, 'Hello world from file 2');

  const f1 = await request(viteNodeApp)
    .post(`/api/projects/${projectId}/files`)
    .set('Authorization', `Bearer ${authToken}`)
    .attach('files', TEST_FILE_1);
  fileId1 = f1.body.files[0].fileId;

  const f2 = await request(viteNodeApp)
    .post(`/api/projects/${projectId}/files`)
    .set('Authorization', `Bearer ${authToken}`)
    .attach('files', TEST_FILE_2);
  fileId2 = f2.body.files[0].fileId;
});

afterAll(async () => {
  if (projectId) {
    const filesInDb = await FileModel.find({ projectId });
    for (const f of filesInDb) {
      await fs.unlink(f.path).catch(() => {});
    }
    await ProjectModel.deleteOne({ projectId });
    await FileModel.deleteMany({ projectId });
    await JobModel.deleteMany({ projectId });
  }

  await fs.unlink(TEST_FILE_1).catch(() => {});
  await fs.unlink(TEST_FILE_2).catch(() => {});

  await UserModel.deleteMany({});
  await mongoose.disconnect();
});

describe('Job Trigger Integration', () => {
  it('POST /api/projects/:projectId/jobs/zip - should start compression', async () => {
    const res = await request(viteNodeApp)
      .post(`/api/projects/${projectId}/jobs/zip`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ fileIds: [fileId1, fileId2] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body.status).toBe('PROCESSING');
    expect(res.body.projectId).toBe(projectId);
  });
});
