import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import { ProjectsPlaceholder } from '../pages/ProjectsPlaceholder';
import { projectService } from '../services/projectService';

const mockMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

vi.mock('../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>,
  );
};

describe('Projects List Component', () => {
  it('should render a loading spinner initially on mount', () => {
    vi.mocked(projectService.getProjects).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ProjectsPlaceholder />);

    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
  });

  it('should show the "No Projects Found" card if the list is empty', async () => {
    vi.mocked(projectService.getProjects).mockResolvedValueOnce({
      data: [],
      meta: mockMeta,
    });

    renderWithProviders(<ProjectsPlaceholder />);

    const emptyHeader = await screen.findByRole('heading', { name: /no projects found/i });
    expect(emptyHeader).toBeInTheDocument();
  });

  it('should render project list cards with file and job counts', async () => {
    const mockProjectsData = [
      {
        id: 'proj_1294',
        name: 'Video Assets Transcoder',
        description: 'Handles local file processing',
        filesCount: 14,
        jobsCount: 3,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(projectService.getProjects).mockResolvedValueOnce({
      data: mockProjectsData,
      meta: { ...mockMeta, total: 1, totalPages: 1 },
    });

    renderWithProviders(<ProjectsPlaceholder />);

    const projectTitle = await screen.findByText(/video assets transcoder/i);
    expect(projectTitle).toBeInTheDocument();

    expect(screen.getByText(/file count:/i)).toHaveTextContent('File Count: 14');
    expect(screen.getByText(/job count:/i)).toHaveTextContent('Job Count: 3');
  });
});
