import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert } from '../components/ui/Alert';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { projectService, ProjectResponse } from '../services/projectService';

export const ProjectsPlaceholder: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  //fetching projects
  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve projects.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProjectCreated = (newProject: ProjectResponse) => {
    //adding new project
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Project-Centric File Processing System
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-500">
            Logged in as: <strong className="text-slate-800">{user?.email}</strong>
          </span>

          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 h-9 px-3 text-xs w-auto text-white cursor-pointer"
          >
            Log Out
          </Button>
        </div>
      </header>
      <Button
        onClick={() => setIsCreateOpen(true)}
        className="bg-slate-900 hover:bg-slate-800 h-9 px-3 text-xs w-auto text-white cursor-pointer"
      >
        Create Project
      </Button>

      {/* body */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="space-y-6">
          <div className="flex flex-col space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Projects</h2>
          </div>

          {/* loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
              <p className="text-sm text-slate-500">Retrieving projects...</p>
            </div>
          )}

          {/* error */}
          {error && !isLoading && (
            <Alert className="max-w-xl mx-auto">
              <span className="font-semibold">Failed to load projects:</span> {error}
            </Alert>
          )}

          {projects.length > 0 && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-900">
                          {project.name}
                        </CardTitle>
                        <span className="text-xs text-slate-400 font-mono">ID: {project.id}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center space-x-4">
                        <span title="Files count">
                          File Count: <strong className="text-slate-700"></strong>
                        </span>
                        <span title="Jobs count">
                          Job Count: <strong className="text-slate-700"></strong>
                        </span>
                      </div>

                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/*creation moddal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
