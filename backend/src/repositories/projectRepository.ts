import { ProjectModel, IProject } from '../database/models/Project.js';

export interface ProjectWithStats {
  id: string;
  name: string;
  description: string;
  filesCount: number;
  jobsCount: number;
  createdAt: Date;
}

export const projectRepository = {
  create: async (data: Partial<IProject>): Promise<IProject> => {
    const newProject = new ProjectModel(data);
    return newProject.save();
  },

  exists: async (projectId: string): Promise<boolean> => {
    const exists = await ProjectModel.exists({ projectId });
    return !!exists;
  },

  findOne: async (projectId: string): Promise<IProject | null> => {
    return ProjectModel.findOne({ projectId });
  },

  findOneAndUpdate: async (
    projectId: string,
    updateData: Partial<IProject>,
  ): Promise<IProject | null> => {
    return ProjectModel.findOneAndUpdate(
      { projectId },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  },

  deleteOne: async (projectId: string) => {
    return ProjectModel.deleteOne({ projectId });
  },

  findAll: async (): Promise<IProject[]> => {
    return ProjectModel.find({}).sort({ createdAt: -1 });
  },

  findAllWithStats: async (): Promise<ProjectWithStats[]> => {
    return ProjectModel.aggregate<ProjectWithStats>([
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: 'files',
          localField: 'projectId',
          foreignField: 'projectId',
          as: 'files',
        },
      },

      {
        $lookup: {
          from: 'jobs',
          localField: 'projectId',
          foreignField: 'projectId',
          as: 'jobs',
        },
      },

      {
        $project: {
          id: '$projectId',
          name: 1,
          description: 1,
          filesCount: { $size: '$files' },
          jobsCount: { $size: '$jobs' },
          createdAt: 1,
          _id: 0,
        },
      },
    ]);
  },
};
