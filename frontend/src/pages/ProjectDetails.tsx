import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'; // Back navigation icon
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert } from '../components/ui/Alert';
import { projectService, ProjectResponse } from '../services/projectService';

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  //states
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to prevent mount-time setStates
  const [error, setError] = useState<string | null>(null);

  //fetch project details
  const fetchProjectDetails = async () => {
    if (!projectId) return;
    try {
      const data = await projectService.getProjectDetails(projectId);
      setProject(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve project details.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/*header*/}
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

      {/*body*/}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/*back*/}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Projects
        </button>

        {/*loading state*/}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="text-sm text-slate-500">Loading project workspace...</p>
          </div>
        )}

        {/*error state*/}
        {error && !isLoading && (
          <Alert className="max-w-xl mx-auto">
            <span className="font-semibold">Error:</span> {error}
          </Alert>
        )}

        {project && !isLoading && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/*project desc card*/}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-mono text-slate-400">PROJECT ID: {project.id}</span>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {project.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>

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

            {/*split layout*/}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/*files area*/}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-sm min-h-[400px]">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-900">Files</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 italic"></p>
                  </CardContent>
                </Card>
              </div>

              {/*jobs area*/}
              <div className="space-y-6">
                <Card className="shadow-sm min-h-[400px]">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Compression Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 italic"></p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
