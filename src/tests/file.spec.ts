import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import { viteNodeApp } from '../index.js';
import { ProjectModel } from '../database/models/Project.js';
import { FileModel } from '../database/models/File.js';
import { connectDatabase } from '../database/index.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/project_centric_file_processor_test';
const DUMMY_FILE_PATH = 'uploads/test-temp-file.txt';
let projectId: string;
let fileId: string;

beforeAll(async () => {
  await connectDatabase(TEST_MONGO_URI);
  await ProjectModel.deleteMany({});
  await FileModel.deleteMany({});

  //create a dummy file for testing
  await fs.writeFile(DUMMY_FILE_PATH, 'This is standard dummy test content.');
});

afterAll(async () => {
  if (projectId) {
    const files = await FileModel.find({ projectId });

    //delete from upload folder
    for (const file of files) {
      await fs.unlink(file.path).catch(() => {});
    }

    await ProjectModel.deleteOne({ projectId });
    await FileModel.deleteMany({ projectId });
  }
  await fs.unlink(DUMMY_FILE_PATH).catch(() => {});
  await mongoose.disconnect();
});

describe('file controller API', () => {
  it('Setup: Create a project first', async () => {
    const res = await request(viteNodeApp)
      .post('/api/projects')
      .send({ name: 'File Test Project', description: 'Testing file APIs' });
    projectId = res.body.id;
  });

  it('POST /api/projects/:projectId/files - should upload files successfully', async () => {
    const res = await request(viteNodeApp)
      .post(`/api/projects/${projectId}/files`)
      .attach('files', DUMMY_FILE_PATH);
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe(projectId);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].name).toBe('test-temp-file.txt');

    fileId = res.body.files[0].fileId;
  });

  it('GET /api/projects/:projectId/files - should list uploaded files', async () => {
    const res = await request(viteNodeApp).get(`/api/projects/${projectId}/files`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].fileId).toBe(fileId);
  });

  it('GET /api/projects/:projectId/files/:fileId/download - should stream download binary', async () => {
    const res = await request(viteNodeApp).get(
      `/api/projects/${projectId}/files/${fileId}/download`,
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('DELETE /api/projects/:projectId/files/:fileId - should delete file from DB and disk', async () => {
    const res = await request(viteNodeApp).delete(`/api/projects/${projectId}/files/${fileId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('File deleted successfully');
  });
});
