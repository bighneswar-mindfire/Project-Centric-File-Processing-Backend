import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { viteNodeApp } from '../index.js';
import { ProjectModel } from '../database/models/Project.js';
import { connectDatabase } from '../database/index.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/project_centric_file_processor_test';
let testProjectId: string;

beforeAll(async () => {
  await connectDatabase(TEST_MONGO_URI);
  await ProjectModel.deleteMany({});
});

afterAll(async () => {
  if (testProjectId) {
    await ProjectModel.deleteOne({ projectId: testProjectId });
  }
  await mongoose.disconnect();
});

describe('project controller API', () => {
  it('POST /api/projects - should create a new project successfully', async () => {
    const res = await request(viteNodeApp).post('/api/projects').send({
      name: 'Test project',
      description: 'Testing project API',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test project');

    testProjectId = res.body.id;
  });

  it('GET /api/projects/:projectId - should retrieve project details with stats', async () => {
    const res = await request(viteNodeApp).get(`/api/projects/${testProjectId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testProjectId);
    expect(res.body.filesCount).toBe(0);
    expect(res.body.jobsCount).toBe(0);
  });

  it('PUT /api/projects/:projectId - should update project details successfully', async () => {
    const res = await request(viteNodeApp).put(`/api/projects/${testProjectId}`).send({
      description: 'updated testing description',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Project updated successfully');
  });

  it('DELETE /api/projects/:projectId - should execute cascading deletion', async () => {
    const res = await request(viteNodeApp).delete(`/api/projects/${testProjectId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');

    // confirm it is deleted
    const getRes = await request(viteNodeApp).get(`/api/projects/${testProjectId}`);
    expect(getRes.status).toBe(404);
  });
});
