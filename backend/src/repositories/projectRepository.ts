import { ProjectModel, IProject } from '../database/models/Project.js';

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
};
