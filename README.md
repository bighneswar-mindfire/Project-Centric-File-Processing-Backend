# Project-Centric File Processing System

A modular and highly scalable Node.js API backend designed to manage projects, handle scoped multiple file uploads, and process asynchronous file compression tasks using background **Worker Threads** [1].

Built with **Express**, **TypeScript**, and **MongoDB (Mongoose)**, the application uses **Vite** with `vite-plugin-node` for Hot Module Replacement (HMR) during development, and compiles into ESM for production.

---

## 🛠️ Features & Architecture

- **Modular MVC Directory Structure:** Separates concerns cleanly between Models, Controllers, Middlewares, Routes, and Helpers.
- **Project-Scoped Domain Boundaries:** All file uploads, file queries, file deletions, and compression jobs are strictly validated and scoped to their parent Project [1].
- **Local File Storage (Metadata in MongoDB):** Raw binary files reside in local disk storage (`uploads/`), while Mongoose tracks file sizes, paths, unique identifiers, and MIME-types safely in MongoDB.
- **Background Worker Threads:** Zip compression runs inside a separate, non-blocking Worker Thread to keep the main Express HTTP thread highly responsive [1]. Supports the modern class-based structure of `archiver` v8.0.0+ while dynamically falling back to older functional versions.
- **Dynamic MIME-Type Resolution:** Automatically corrects files sent with generic `application/octet-stream` headers (common in testing tools like Postman/Thunder Client) based on their file extensions.
- **Clean Isolated Integration Testing:** An automated integration test suite powered by **Vitest** and **Supertest** [1.1.2]. Each test file executes sequentially on its own dedicated test database and cleans up both Mongoose records and local physical uploads on teardown [1, 2].
- **Strict Security & Code Quality:** Linted with ESLint (Flat Config), formatted with Prettier, guarded by Husky pre-commit hooks, guarded against secret leaks with Gitleaks, and validated by Commitlint for Conventional Commits.

---

## 📂 Project Directory Structure

```text
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── CODEOWNERS
├── src/
│   ├── database/
│   │   ├── models/
│   │   │   ├── Project.ts
│   │   │   ├── File.ts
│   │   │   └── Job.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── projectController.ts
│   │   ├── fileController.ts
│   │   └── jobController.ts
│   ├── middlewares/
│   │   └── uploadMiddleware.ts
│   ├── routes/
│   │   ├── projectRoutes.ts
│   │   ├── fileRoutes.ts
│   │   └── jobRoutes.ts
│   ├── utils/                 # General helpers (IDs and MIME-types)
│   │   └── idGenerator.ts
│   ├── tests/                 # Integration test specs (Isolated & sequential)
│   │   ├── project.spec.ts
│   │   ├── file.spec.ts
│   │   └── job.spec.ts
│   ├── index.ts               # Express server entry point
│   └── worker.ts              # Background ZIP compression worker thread
├── uploads/                   # Local folder for file storage (auto-created)
├── eslint.config.js           # ESLint Flat Config rules
├── .prettierrc                # Prettier code formatting rules
├── .gitleaks.toml             # Secret scanner rules
├── commitlint.config.js       # Conventional commit rules
├── vite.config.ts             # Vite server config
├── tsconfig.json              # TypeScript compiler configurations
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js]
- [MongoDB Community Server]

### 1. Installation

Clone the repository and install all dependencies:

```bash
git clone <your-repository-url>
cd project-centric-file-processor
npm install
```

### 2. Configure Git Hooks

Initialize Husky to validate code formats and enforce commit message syntax before every commit:

```bash
npx husky init
```

> **Windows PowerShell:** Register executable permissions in Git by running:
>
> ```bash
> git update-index --add --chmod=+x .husky/pre-commit .husky/commit-msg
> ```

---

## 💻 Running the Application

### Development (With Hot Module Replacement)

Starts the Express server with near-instant hot-reloads on file saves:

```bash
npm run dev
```

The server will boot up on `http://localhost:3000`. You can verify your connection to MongoDB by visiting the health endpoint:

```
GET http://localhost:3000/api/health
```

### Production Build & Execution

Build the compiled ESM bundle into `/dist` and start the production server:

```bash
npm run build
npm run start
```

---

## Testing

The automated integration test suite tests every single API endpoint. Test files run sequentially on isolated databases so their teardown cleanups never interfere with other active tests:

```bash
npm run test
```

---

## API Reference

All routes are prefixed with `/api`.

### 1. Project Management

#### Create Project

`POST /api/projects`

```json
// Request Body
{ "name": "Video Assets", "description": "Handles raw media uploads" }

// Response (201 Created)
{ "id": "proj_1234", "name": "Video Assets", "description": "...", "createdAt": "..." }
```

#### Get Project Details

`GET /api/projects/:projectId`

Returns project details along with an indexed count of its files and jobs.

#### Update Project

`PUT /api/projects/:projectId`

Dynamically updates the name or description of an existing project.

#### Delete Project

`DELETE /api/projects/:projectId`

Cascadingly deletes the project, its file records, job histories, and deletes all associated files from disk.

---

### 2. File Management (Project-Scoped)

#### Upload Files

`POST /api/projects/:projectId/files`

Accepts `multipart/form-data` with files under the key `files`. Cleans up saved files from disk if the `projectId` is invalid.

#### List Project Files

`GET /api/projects/:projectId/files`

Returns a clean list of file metadata belonging to the project (omits local disk paths).

#### Delete File

`DELETE /api/projects/:projectId/files/:fileId`

Deletes the file metadata from MongoDB and unlinks the raw binary from server disk storage.

#### Download File

`GET /api/projects/:projectId/files/:fileId/download`

Downloads the file as an attachment.

---

### 3. Background Compression Jobs (Project-Scoped)

#### Create ZIP Job

`POST /api/projects/:projectId/jobs/zip`

Validates ownership of files, registers a `PROCESSING` job, spawns a Worker thread, and immediately returns a `201` status.

```json
// Request Body
{ "fileIds": ["file_1111", "file_2222"] }
```

#### Get Job Status

`GET /api/projects/:projectId/jobs/:jobId`

Returns the dynamic progress percentage and status of the task (`PROCESSING`, `COMPLETED`, or `FAILED`).
