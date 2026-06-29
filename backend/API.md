# API Documentation

**Base URL:** `http://localhost:3000/api`
**Authentication:** All protected routes require a header: `Authorization: Bearer <JWT_TOKEN>`

## Authentication

### 1. Signup

`POST /auth/signup`

- **Body:** `{ "email": "string", "password": "string" }`
- **Success (201):** `{ "token": "string", "user": { "email": "string" } }`
- **Errors:** 400 (User exists / Missing fields)

### 2. Login

`POST /auth/login`

- **Body:** `{ "email": "string", "password": "string" }`
- **Success (200):** `{ "token": "string", "user": { "email": "string" } }`
- **Errors:** 400 (Invalid credentials)

## Project Management (Protected)

### 3. List Projects

`GET /projects`

- **Success (200):** `Array<{ id, name, description, filesCount, jobsCount, createdAt }>`

### 4. Create Project

`POST /projects`

- **Body:** `{ "name": "string", "description": "string" }`
- **Success (201):** `{ id, name, description, createdAt }`

### 5. Get Project Details

`GET /projects/:projectId`

- **Success (200):** `{ id, name, description, filesCount, jobsCount, createdAt }`
- **Errors:** 404 (Not found)

### 6. Delete Project

`DELETE /projects/:projectId`

- **Success (200):** `{ "message": "Project and all associated files and jobs deleted" }`

## ile Management (Protected)

### 7. Upload Files

`POST /projects/:projectId/files`

- **Body:** `multipart/form-data` (Key: `files`)
- **Success (201):** `{ "projectId": "string", "files": Array<{ fileId, name, size, type, uploadedAt }> }`

### 8. List Files

`GET /projects/:projectId/files`

- **Success (200):** `Array<{ fileId, name, size, uploadedAt }>`

### 9. Delete File

`DELETE /projects/:projectId/files/:fileId`

- **Success (200):** `{ "message": "File deleted successfully" }`

### 10. Download File

`GET /projects/:projectId/files/:fileId/download`

- **Success (200):** Binary File Stream (Headers: `Content-Disposition: attachment`)

## Background Jobs (Protected)

### 11. Create ZIP Job

`POST /projects/:projectId/jobs/zip`

- **Body:** `{ "fileIds": ["string"] }`
- **Success (201):** `{ jobId, projectId, status: "PROCESSING", createdAt }`

### 12. Get Job Status

`GET /projects/:projectId/jobs/:jobId`

- **Success (200):** `{ jobId, status, progress, outputFileId?, error?, completedAt? }`
