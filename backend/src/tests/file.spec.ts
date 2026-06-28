process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'f978e8b2e3f6e100f91a547b74b1e59c1c68f12d2db763e0078b5490fd38927a';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import { SignJWT } from 'jose';
import { viteNodeApp } from '../index.js';
import { ProjectModel } from '../database/models/Project.js';
import { FileModel } from '../database/models/File.js';
import { UserModel } from '../database/models/User.js';
import { connectDatabase } from '../database/index.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/project_centric_test_file_management';
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
const DUMMY_FILE_PATH = 'uploads/test-upload-asset.txt';

let authToken: string;
let projectId: string;
let fileId: string;

beforeAll(async () => {
  await connectDatabase(TEST_DB_URI);

  await ProjectModel.deleteMany({});
  await FileModel.deleteMany({});
  await UserModel.deleteMany({});

  const testEmail = 'file-tester@example.com';
  await UserModel.create({
    email: testEmail,
    passwordHash: 'placeholder_hash',
    salt: 'placeholder_salt',
  });

  authToken = await new SignJWT({ email: testEmail })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(SECRET_KEY);

  await fs.writeFile(DUMMY_FILE_PATH, 'This is some dummy content for testing file uploads.');
});

afterAll(async () => {
  if (projectId) {
    const files = await FileModel.find({ projectId });
    for (const file of files) {
      await fs.unlink(file.path).catch(() => {});
    }
    await ProjectModel.deleteOne({ projectId });
    await FileModel.deleteMany({ projectId });
  }

  await fs.unlink(DUMMY_FILE_PATH).catch(() => {});
  await UserModel.deleteMany({});
  await mongoose.disconnect();
});

describe('File Management Integration Tests', () => {
  it('Setup: Create a project first', async () => {
    const res = await request(viteNodeApp)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'File Test Environment',
        description: 'Testing file upload, list, download, and delete',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    projectId = res.body.id;
  });

  it('POST /api/projects/:projectId/files - should upload files successfully', async () => {
    const res = await request(viteNodeApp)
      .post(`/api/projects/${projectId}/files`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('files', DUMMY_FILE_PATH);

    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(projectId);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].name).toBe('test-upload-asset.txt');

    fileId = res.body.files[0].fileId;
  });

  it('GET /api/projects/:projectId/files/:fileId/download - should stream download binary', async () => {
    const res = await request(viteNodeApp)
      .get(`/api/projects/${projectId}/files/${fileId}/download`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-type']).toContain('text/plain');
  });
});
