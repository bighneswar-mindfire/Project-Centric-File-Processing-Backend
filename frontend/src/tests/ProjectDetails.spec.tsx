import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { ProjectDetails } from '../pages/ProjectDetails';
import { projectService } from '../services/projectService';
import { fileService } from '../services/fileService';
import { jobService } from '../services/jobService';

// Reusable mock pagination metadata
const mockMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

// Mock React Router's useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ projectId: 'proj_1111' }),
  };
});

// Mock API Services
vi.mock('../services/projectService', () => ({
  projectService: {
    getProjectDetails: vi.fn(),
  },
}));

vi.mock('../services/fileService', () => ({
  fileService: {
    getFiles: vi.fn(),
    uploadFiles: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

vi.mock('../services/jobService', () => ({
  jobService: {
    getJobs: vi.fn(),
    getJobStatus: vi.fn(),
    createZipJob: vi.fn(),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>,
  );
};

describe('ProjectDetails Component', () => {
  it('should show a loading spinner initially on mount', () => {
    // Show loading state by keeping project details pending
    vi.mocked(projectService.getProjectDetails).mockReturnValue(new Promise(() => {}));

    // Return paginated structure for files and jobs
    vi.mocked(fileService.getFiles).mockResolvedValue({ data: [], meta: mockMeta });
    vi.mocked(jobService.getJobs).mockResolvedValue({ data: [], meta: mockMeta });

    renderWithProviders(<ProjectDetails />);

    expect(screen.getByText(/loading project/i)).toBeInTheDocument();
  });

  it('should show the alert banner if database fetching fails', async () => {
    vi.mocked(projectService.getProjectDetails).mockRejectedValueOnce(
      new Error('Database offline.'),
    );
    vi.mocked(fileService.getFiles).mockResolvedValue({ data: [], meta: mockMeta });
    vi.mocked(jobService.getJobs).mockResolvedValue({ data: [], meta: mockMeta });

    renderWithProviders(<ProjectDetails />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/error loading project/i);
    expect(alert).toHaveTextContent(/database offline/i);
  });

  it('should show project details, file lists, and compression jobs', async () => {
    const mockProject = {
      id: 'proj_1111',
      name: 'Test',
      description: 'Testing',
      filesCount: 1,
      jobsCount: 1,
      createdAt: new Date().toISOString(),
    };

    const mockFilesData = [
      {
        fileId: 'file_2222',
        name: 'test.png',
        size: 1048576,
        type: 'image/png',
        uploadedAt: new Date().toISOString(),
      },
    ];

    const mockJobsData = [
      {
        jobId: 'job_3333',
        projectId: 'proj_1111',
        type: 'ZIP_COMPRESSION' as const,
        status: 'COMPLETED' as const,
        progress: 100,
        fileIds: ['file_2222'],
        outputFileId: 'file_zip_123',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(projectService.getProjectDetails).mockResolvedValueOnce(mockProject);

    // Fix: Resolve with data and meta properties
    vi.mocked(fileService.getFiles).mockResolvedValue({
      data: mockFilesData,
      meta: { ...mockMeta, total: 1, totalPages: 1 },
    });
    vi.mocked(jobService.getJobs).mockResolvedValue({
      data: mockJobsData,
      meta: { ...mockMeta, total: 1, totalPages: 1 },
    });

    renderWithProviders(<ProjectDetails />);

    // check project headers
    const projectName = await screen.findByText('Test');
    expect(projectName).toBeInTheDocument();
    expect(screen.getByText(/PROJECT ID: proj_1111/i)).toBeInTheDocument();

    // check file list
    expect(screen.getByText(/test.png/i)).toBeInTheDocument();
    expect(screen.getByText(/size: 1 MB/i)).toBeInTheDocument();

    // check job list
    expect(screen.getByText(/job_3333/i)).toBeInTheDocument();

    // check for download button
    expect(screen.getByRole('button', { name: /download zip/i })).toBeInTheDocument();
  });
});
