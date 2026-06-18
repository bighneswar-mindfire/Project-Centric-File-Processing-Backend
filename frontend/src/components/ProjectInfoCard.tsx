import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ProjectResponse } from '../services/projectService';

interface ProjectInfoCardProps {
  project: ProjectResponse;
}

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-mono text-slate-400">PROJECT ID: {project.id}</span>
          <CardTitle className="text-2xl font-bold text-slate-900">{project.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>

        {/*date*/}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>
              File Count: <strong className="text-slate-700">{project.filesCount}</strong>
            </span>
            <span>
              Job Count: <strong className="text-slate-700">{project.jobsCount}</strong>
            </span>
          </div>
          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
