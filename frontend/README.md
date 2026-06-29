# FileProcessor UI – Frontend

A minimalist, high-performance React dashboard designed for managing project-scoped file uploads and monitoring background compression jobs.

## Key Features

- **Project Management:** Create, view, and delete project workspaces.
- **File Management:** Custom drag-and-drop uploader with real-time XHR progress tracking.
- **Background Jobs:** Live status polling for worker-thread compression tasks.
- **Security:** Guarded by JWT-based protected routes and session persistence.

## Installation

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

## Development

Start the local development server:

```bash
npm run dev
```

Note: Requires the Backend API to be running at http://localhost:3000. The Vite proxy is configured to forward all /api requests automatically.

## Build

Compile and minify the application for production:

```bash
npm run build
```

The output will be generated in the dist/ folder.

## Deployment

The production frontend is hosted on Vercel:
https://project-centric-file-processing-bac.vercel.app
