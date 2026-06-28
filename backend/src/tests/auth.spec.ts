import { describe, it, expect, beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'f978e8b2e3f6e100f91a547b74b1e59c1c68f12d2db763e0078b5490fd38927a';

import request from 'supertest';
import mongoose from 'mongoose';
import { viteNodeApp } from '../index.js';
import { UserModel } from '../database/models/User.js';
import { connectDatabase } from '../database/index.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/project_centric_test_auth';

describe('Authentication Integration Tests', () => {
  const testUser = {
    email: 'auth-tester@example.com',
    password: 'SecurePassword123!',
  };

  beforeAll(async () => {
    await connectDatabase(TEST_DB_URI);

    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await mongoose.disconnect();
  });

  it('POST /api/auth/signup - should register a new user successfully', async () => {
    const res = await request(viteNodeApp).post('/api/auth/signup').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('POST /api/auth/signup - should block registration with a duplicate email', async () => {
    const res = await request(viteNodeApp).post('/api/auth/signup').send(testUser);

    expect(res.status).toBe(400);

    expect(res.body.error).toContain('exists');
  });

  it('POST /api/auth/login - should authenticate valid credentials and return a token', async () => {
    const res = await request(viteNodeApp).post('/api/auth/login').send(testUser);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('POST /api/auth/login - should reject login with the wrong password', async () => {
    const res = await request(viteNodeApp).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid');
  });

  it('POST /api/auth/login - should reject login for a non-existent email', async () => {
    const res = await request(viteNodeApp).post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'SomePassword123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid');
  });
});
