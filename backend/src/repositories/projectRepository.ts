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
    const exists = await ProjectModel.exists({ projectId, deletedAt: null });
    return !!exists;
  },

  findOne: async (projectId: string): Promise<IProject | null> => {
    return ProjectModel.findOne({ projectId, deletedAt: null });
  },

  findOneAndUpdate: async (
    projectId: string,
    updateData: Partial<IProject>,
  ): Promise<IProject | null> => {
    return ProjectModel.findOneAndUpdate(
      { projectId, deletedAt: null },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  },

  softDelete: async (projectId: string) => {
    return ProjectModel.updateOne(
      { projectId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );
  },

  findAll: async (): Promise<IProject[]> => {
    return ProjectModel.find({ deletedAt: null }).sort({ createdAt: -1 });
  },

  findAllWithStats: async (): Promise<ProjectWithStats[]> => {
    return ProjectModel.aggregate<ProjectWithStats>([
      { $match: { deletedAt: null } },

      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: 'files',
          let: { projId: '$projectId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$projectId', '$$projId'] }, { $eq: ['$deletedAt', null] }],
                },
              },
            },
          ],
          as: 'files',
        },
      },

      {
        $lookup: {
          from: 'jobs',
          let: { projId: '$projectId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$projectId', '$$projId'] }, { $eq: ['$deletedAt', null] }],
                },
              },
            },
          ],
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
