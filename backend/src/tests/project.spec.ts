import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { SignJWT } from 'jose';
import { viteNodeApp } from '../index.js';
import { ProjectModel } from '../database/models/Project.js';
import { UserModel } from '../database/models/User.js';
import { connectDatabase } from '../database/index.js';

process.env.NODE_ENV = 'test';
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/project_centric_test_project_crud';

const SECRET_STR = 'f978e8b2e3f6e100f91a547b74b1e59c1c68f12d2db763e0078b5490fd38927a';
const SECRET_KEY = new TextEncoder().encode(SECRET_STR);

let authToken: string;
let testProjectId: string;

beforeAll(async () => {
  process.env.JWT_SECRET = SECRET_STR;
  process.env.NODE_ENV = 'test';

  await connectDatabase(TEST_DB_URI);

  await ProjectModel.deleteMany({});
  await UserModel.deleteMany({});

  const testEmail = 'project-tester@example.com';
  await UserModel.create({
    email: testEmail,
    passwordHash: 'hashed_placeholder',
    salt: 'salt_placeholder',
  });

  authToken = await new SignJWT({ email: testEmail })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(SECRET_KEY);
});

afterAll(async () => {
  await ProjectModel.deleteMany({});
  await UserModel.deleteMany({});
  await mongoose.disconnect();
});

describe('Project CRUD Integration Tests', () => {
  it('POST /api/projects - should create a new project successfully', async () => {
    const res = await request(viteNodeApp)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Automated Test Project',
        description: 'Testing full CRUD lifecycle',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Automated Test Project');

    testProjectId = res.body.id;
  });

  it('GET /api/projects/:projectId - should retrieve project details with stats', async () => {
    const res = await request(viteNodeApp)
      .get(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testProjectId);
    expect(res.body).toHaveProperty('filesCount');
    expect(res.body).toHaveProperty('jobsCount');

    expect(res.body.filesCount).toBe(0);
    expect(res.body.jobsCount).toBe(0);
  });

  it('PUT /api/projects/:projectId - should update project details successfully', async () => {
    const res = await request(viteNodeApp)
      .put(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: 'Successfully updated the project description',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Project updated successfully');

    const verifyRes = await request(viteNodeApp)
      .get(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(verifyRes.body.description).toBe('Successfully updated the project description');
  });

  it('DELETE /api/projects/:projectId - should execute cascading deletion', async () => {
    const res = await request(viteNodeApp)
      .delete(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');

    const checkRes = await request(viteNodeApp)
      .get(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkRes.status).toBe(404);
  });
});
