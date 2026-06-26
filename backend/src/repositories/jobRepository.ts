import { JobModel, IJob } from '../database/models/Job.js';

export const jobRepository = {
  create: async (data: Partial<IJob>): Promise<IJob> => {
    const newJob = new JobModel(data);
    return newJob.save();
  },

  findOne: async (projectId: string, jobId: string): Promise<IJob | null> => {
    return JobModel.findOne({ projectId, jobId, deletedAt: null });
  },

  findManyByProjectId: async (projectId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const data = await JobModel.find({ projectId, deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobModel.countDocuments({ projectId, deletedAt: null });
    return { data, total };
  },

  count: async (projectId: string): Promise<number> => {
    return JobModel.countDocuments({ projectId, deletedAt: null });
  },

  softDeleteMany: async (projectId: string) => {
    return JobModel.updateMany({ projectId, deletedAt: null }, { $set: { deletedAt: new Date() } });
  },
};
