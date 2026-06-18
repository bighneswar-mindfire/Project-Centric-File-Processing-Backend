import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { viteNodeApp } from '../index.js';
import { UserModel } from '../database/models/User.js';
import { connectDatabase } from '../database/index.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/project_centric_file_processor_test_auth';

beforeAll(async () => {
  await connectDatabase(TEST_MONGO_URI);
  await UserModel.deleteMany({});
});

afterAll(async () => {
  await UserModel.deleteMany({});
  await mongoose.disconnect();
});

describe('Authentication  API', () => {
  const testEmail = 'vigbi@abc.com';
  const testPassword = 'qqqqqq';

  it('should register a new user successfully (signup)', async () => {
    const res = await request(viteNodeApp).post('/api/auth/signup').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should authenticate valid credentials (login)', async () => {
    const res = await request(viteNodeApp).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should reject invalid credentials', async () => {
    const res = await request(viteNodeApp).post('/api/auth/login').send({
      email: testEmail,
      password: 'qwerty',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid');
  });
});
